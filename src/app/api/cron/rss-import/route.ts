import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReadOnlyClient } from '@/lib/supabase/server'

// Import quotidien d'actualités TT (FFTT/France + ITTF/WTT) en catégorie "tt".
// Enrichit chaque article : image (og:image) + description (og:description) depuis
// la page réelle, traduit l'anglais en français. Cron Vercel 1x/jour.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface Source { name: string; url: string; lang: 'fr' | 'en' }
const SOURCES: Source[] = [
  { name: 'FFTT / France', url: 'https://news.google.com/rss/search?q=%22tennis%20de%20table%22%20(FFTT%20OR%20%22%C3%A9quipe%20de%20France%22%20OR%20championnat%20OR%20Lebrun)&hl=fr&gl=FR&ceid=FR:fr', lang: 'fr' },
  { name: 'ITTF / WTT', url: 'https://news.google.com/rss/search?q=ITTF%20OR%20%22World%20Table%20Tennis%22%20table%20tennis&hl=en-US&gl=US&ceid=US:en', lang: 'en' },
]
const MAX_PER_SOURCE = 6
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#8217;/g, "'").replace(/&#8230;/g, '...')
    .replace(/&#8211;/g, '-').replace(/&#8212;/g, '-')
    .replace(/&amp;/g, '&')
}
function stripTags(s: string): string {
  let t = decodeEntities(decodeEntities(s || ''))
  t = t.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/&#\d+;/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}
function pick(block: string, tag: string): string {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'))
  return m ? m[1].trim() : ''
}
function metaProp(html: string, prop: string): string {
  let m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'))
  if (!m) m = html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + prop + '["\']', 'i'))
  return m ? decodeEntities(m[1]).trim() : ''
}

async function fetchWithTimeout(url: string, ms: number, accept: string): Promise<Response | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, 'Accept': accept }, redirect: 'follow', cache: 'no-store', signal: ctrl.signal })
  } catch { return null } finally { clearTimeout(t) }
}

async function enrich(link: string): Promise<{ image: string | null; desc: string; finalUrl: string }> {
  const res = await fetchWithTimeout(link, 7000, 'text/html,application/xhtml+xml,*/*')
  if (!res || !res.ok) return { image: null, desc: '', finalUrl: link }
  const finalUrl = res.url || link
  const html = (await res.text()).slice(0, 200000)
  const image = metaProp(html, 'og:image') || metaProp(html, 'twitter:image') || null
  const desc = metaProp(html, 'og:description') || metaProp(html, 'description') || ''
  return { image, desc, finalUrl }
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
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data) && Array.isArray(data[0])) return data[0].map((seg: string[]) => (seg && seg[0]) || '').join('')
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
    let added = 0, withImg = 0, withDesc = 0
    try {
      const res = await fetchWithTimeout(src.url, 10000, 'application/rss+xml, application/xml, text/xml, */*')
      const xml = res ? await res.text() : ''
      if (!res || !res.ok) { detail[src.name] = 'feed_ko'; continue }
      const blocks = (xml.match(/<item[\s\S]*?<\/item>/gi) || []).slice(0, MAX_PER_SOURCE)

      const enriched = await Promise.all(blocks.map(async (block) => {
        const link = stripTags(pick(block, 'link'))
        const e = link ? await enrich(link) : { image: null, desc: '', finalUrl: link }
        return { block, link, ...e }
      }))

      for (const it of enriched) {
        if (!it.link) continue
        const { data: existing } = await supabase.from('news').select('id').eq('source_url', it.link).maybeSingle()
        if (existing) continue

        let rawTitle = stripTags(pick(it.block, 'title'))
        let publisher = src.name
        const dash = rawTitle.lastIndexOf(' - ')
        if (dash > 20) { publisher = rawTitle.slice(dash + 3).trim(); rawTitle = rawTitle.slice(0, dash).trim() }

        let title = rawTitle
        let excerpt = (it.desc || stripTags(pick(it.block, 'description'))).slice(0, 600)
        if (src.lang !== 'fr') {
          title = await translateToFr(title)
          if (excerpt) excerpt = await translateToFr(excerpt)
        }
        if (it.image) withImg++
        if (excerpt && excerpt.length > 40) withDesc++

        const articleUrl = (it.finalUrl && !it.finalUrl.includes('news.google.com')) ? it.finalUrl : it.link
        const pub = pick(it.block, 'pubDate')
        const dt = pub ? new Date(pub) : new Date()
        const publishedAt = isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
        const content =
          '<p>' + (excerpt || title) + '</p>' +
          '<p><em>Source : ' + publisher + '</em></p>' +
          '<p><a href="' + articleUrl + '" target="_blank" rel="noopener noreferrer">Lire l&apos;article complet sur ' + publisher + ' &rarr;</a></p>'

        const { error } = await supabase.from('news').insert({
          category: 'tt',
          title: title.slice(0, 250),
          excerpt: excerpt.slice(0, 500),
          content,
          image_url: it.image,
          status: 'published',
          published_at: publishedAt,
          source_name: publisher.slice(0, 120),
          source_url: it.link,
          is_external: true,
        })
        if (!error) { added++; total++ }
      }
    } catch (e) { detail[src.name] = 'err:' + (e instanceof Error ? e.message : String(e)); continue }
    detail[src.name] = 'added=' + added + ' img=' + withImg + ' desc=' + withDesc
  }

  if (total > 0) { try { revalidatePath('/actualites', 'layout') } catch { /* noop */ } }
  return NextResponse.json({ ok: true, imported: total, detail, at: new Date().toISOString() })
}
