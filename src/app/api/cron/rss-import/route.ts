import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReadOnlyClient } from '@/lib/supabase/server'

// Import quotidien d'actualités TT haut niveau (FFTT + ITTF) en catégorie "tt".
// Récupère le vrai flux fédéral (contenu riche + image) via proxy si bloqué,
// avec repli Google News. Traduit l'anglais (ITTF) en français.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface Source { name: string; url: string; fallback?: string; lang: 'fr' | 'en' }
const SOURCES: Source[] = [
  {
    name: 'FFTT', lang: 'fr',
    url: 'https://www.fftt.com/feed/',
    fallback: 'https://news.google.com/rss/search?q=%22tennis%20de%20table%22%20(FFTT%20OR%20%22%C3%A9quipe%20de%20France%22%20OR%20championnat%20OR%20Lebrun)&hl=fr&gl=FR&ceid=FR:fr',
  },
  {
    name: 'ITTF / WTT', lang: 'en',
    url: 'https://www.ittf.com/feed/',
    fallback: 'https://news.google.com/rss/search?q=ITTF%20OR%20%22World%20Table%20Tennis%22&hl=en-US&gl=US&ceid=US:en',
  },
]
const MAX_PER_SOURCE = 8
const UA = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#8217;/g, "'").replace(/&#8230;/g, '...')
    .replace(/&#8211;/g, '-').replace(/&#8216;/g, "'").replace(/&amp;/g, '&')
}
function stripTags(s: string): string {
  let t = decodeEntities(decodeEntities(s))
  t = t.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/&#\d+;/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}
function pick(block: string, tag: string): string {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'))
  return m ? m[1].trim() : ''
}
function pickImage(block: string): string | null {
  let m = block.match(/<media:content[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)
  if (m) return m[1]
  m = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
  if (m) return m[1]
  m = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i)
  if (m) return m[1]
  const html = decodeEntities(pick(block, 'content:encoded') + ' ' + pick(block, 'description'))
  m = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)
  if (m) return m[1]
  m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (m) return m[1]
  return null
}

async function fetchXml(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: UA, cache: 'no-store' })
    if (r.ok) {
      const t = await r.text()
      if (/<item[\s>]/i.test(t)) return t
    }
  } catch { /* on tente le proxy */ }
  // Proxy (contourne les blocages d'IP datacenter type Cloudflare)
  try {
    const p = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)
    const r = await fetch(p, { headers: UA, cache: 'no-store' })
    if (r.ok) return await r.text()
  } catch { /* ignore */ }
  return ''
}

async function translateToFr(text: string): Promise<string> {
  const clean = (text || '').trim()
  if (!clean) return clean
  try {
    const deepl = process.env.DEEPL_API_KEY
    if (deepl) {
      const base = deepl.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
      const res = await fetch(base + '/v2/translate', {
        method: 'POST',
        headers: { 'Authorization': 'DeepL-Auth-Key ' + deepl, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: clean, target_lang: 'FR', source_lang: 'EN' }),
      })
      if (res.ok) { const j = await res.json(); return j?.translations?.[0]?.text || clean }
    }
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=' + encodeURIComponent(clean.slice(0, 1500))
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((seg: string[]) => (seg && seg[0]) || '').join('')
      }
    }
  } catch { /* repli : texte original */ }
  return clean
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === 'Bearer ' + secret) return true
  try {
    const sb = await createReadOnlyClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user?.email) return false
    const { data } = await sb.from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
    return !!data
  } catch { return false }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const detail: Record<string, string> = {}
  let total = 0

  for (const src of SOURCES) {
    let added = 0
    let usedFallback = false
    try {
      let xml = await fetchXml(src.url)
      let blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || []
      if (blocks.length === 0 && src.fallback) {
        usedFallback = true
        xml = await fetchXml(src.fallback)
        blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || []
      }
      for (const block of blocks.slice(0, MAX_PER_SOURCE)) {
        const link = stripTags(pick(block, 'link'))
        if (!link) continue
        const { data: existing } = await supabase.from('news').select('id').eq('source_url', link).maybeSingle()
        if (existing) continue
        let title = stripTags(pick(block, 'title'))
        // Résumé : description, sinon début du contenu complet
        let excerpt = stripTags(pick(block, 'description'))
        if (excerpt.length < 120) {
          const full = stripTags(pick(block, 'content:encoded'))
          if (full.length > excerpt.length) excerpt = full
        }
        excerpt = excerpt.slice(0, 600).trim()
        if (!title) continue
        if (src.lang !== 'fr') {
          title = await translateToFr(title)
          if (excerpt) excerpt = await translateToFr(excerpt)
        }
        const image = pickImage(block)
        const pub = pick(block, 'pubDate')
        const dt = pub ? new Date(pub) : new Date()
        const publishedAt = isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
        const content = '<p>' + excerpt + '</p><p><a href="' + link + '" target="_blank" rel="noopener noreferrer">Lire l&apos;article complet sur ' + src.name + ' &rarr;</a></p>'
        const { error } = await supabase.from('news').insert({
          category: 'tt',
          title: title.slice(0, 250),
          excerpt: excerpt.slice(0, 400),
          content,
          image_url: image,
          status: 'published',
          published_at: publishedAt,
          source_name: src.name,
          source_url: link,
          is_external: true,
        })
        if (!error) { added++; total++ }
      }
      detail[src.name] = 'ok' + (usedFallback ? '(fallback)' : '') + ' added=' + added
    } catch (e) {
      detail[src.name] = 'err:' + (e instanceof Error ? e.message : String(e))
    }
  }

  if (total > 0) { try { revalidatePath('/actualites', 'layout') } catch { /* noop */ } }
  return NextResponse.json({ ok: true, imported: total, detail, at: new Date().toISOString() })
}
