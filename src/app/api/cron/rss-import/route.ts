import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReadOnlyClient } from '@/lib/supabase/server'

// Import quotidien d'actualités TT en catégorie "tt".
// - FFTT/France : vrai flux FFTT via proxy rss2json -> images + contenu + liens directs fftt.com
// - International (ITTF/WTT) : Google News (anglais) traduit en français
// Cron Vercel 1x/jour.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface Source { name: string; via: 'rss2json' | 'gnews'; url: string; lang: 'fr' | 'en' }
const SOURCES: Source[] = [
  { name: 'FFTT', via: 'rss2json', url: 'https://www.fftt.com/feed/', lang: 'fr' },
  { name: 'ITTF / WTT', via: 'gnews', url: 'https://news.google.com/rss/search?q=ITTF%20OR%20%22World%20Table%20Tennis%22%20table%20tennis&hl=en-US&gl=US&ceid=US:en', lang: 'en' },
]
const MAX_PER_SOURCE = 8
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

interface Item { title: string; link: string; pubDate: string; image: string | null; desc: string }

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#8217;/g, "'").replace(/&#8230;/g, '...')
    .replace(/&#8211;/g, '-').replace(/&#8212;/g, '-').replace(/&amp;/g, '&')
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
function firstImg(html: string): string | null {
  const m = decodeEntities(html || '').match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

async function fetchWithTimeout(url: string, ms: number, accept: string): Promise<Response | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, 'Accept': accept }, redirect: 'follow', cache: 'no-store', signal: ctrl.signal })
  } catch { return null } finally { clearTimeout(t) }
}

// Récupère un vrai flux (FFTT) via rss2json -> items avec image + contenu + lien direct
async function viaRss2Json(feedUrl: string): Promise<Item[]> {
  const api = 'https://api.rss2json.com/v1/api.json?count=' + MAX_PER_SOURCE + '&rss_url=' + encodeURIComponent(feedUrl)
  const r = await fetchWithTimeout(api, 12000, 'application/json')
  if (!r || !r.ok) return []
  const j = await r.json()
  if (j?.status !== 'ok' || !Array.isArray(j.items)) return []
  return j.items.slice(0, MAX_PER_SOURCE).map((it: Record<string, unknown>): Item => ({
    title: stripTags(String(it.title || '')),
    link: String(it.link || ''),
    pubDate: String(it.pubDate || ''),
    image: (it.thumbnail ? String(it.thumbnail) : '') ||
           (it.enclosure && (it.enclosure as Record<string, unknown>).link ? String((it.enclosure as Record<string, unknown>).link) : '') ||
           firstImg(String(it.content || it.description || '')) || null,
    desc: stripTags(String(it.description || it.content || '')).slice(0, 600),
  }))
}

// Google News (XML)
async function viaGnews(feedUrl: string): Promise<Item[]> {
  const r = await fetchWithTimeout(feedUrl, 10000, 'application/rss+xml, application/xml, */*')
  if (!r || !r.ok) return []
  const xml = await r.text()
  const blocks = (xml.match(/<item[\s\S]*?<\/item>/gi) || []).slice(0, MAX_PER_SOURCE)
  return blocks.map((b): Item => ({
    title: stripTags(pick(b, 'title')),
    link: stripTags(pick(b, 'link')),
    pubDate: pick(b, 'pubDate'),
    image: null,
    desc: stripTags(pick(b, 'description')).slice(0, 600),
  }))
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
  } catch { /* repli */ }
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
    let added = 0, withImg = 0
    try {
      const items = src.via === 'rss2json' ? await viaRss2Json(src.url) : await viaGnews(src.url)
      for (const it of items) {
        if (!it.link) continue
        const { data: existing } = await supabase.from('news').select('id').eq('source_url', it.link).maybeSingle()
        if (existing) continue

        let rawTitle = it.title
        let publisher = src.name
        const dash = rawTitle.lastIndexOf(' - ')
        if (src.via === 'gnews' && dash > 20) { publisher = rawTitle.slice(dash + 3).trim(); rawTitle = rawTitle.slice(0, dash).trim() }

        let title = rawTitle
        let excerpt = it.desc
        if (src.lang !== 'fr') {
          title = await translateToFr(title)
          if (excerpt) excerpt = await translateToFr(excerpt)
        }
        if (it.image) withImg++

        const dt = it.pubDate ? new Date(it.pubDate) : new Date()
        const publishedAt = isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
        const content =
          '<p>' + (excerpt || title) + '</p>' +
          '<p><em>Source : ' + publisher + '</em></p>' +
          '<p><a href="' + it.link + '" target="_blank" rel="noopener noreferrer">Lire l&apos;article complet sur ' + publisher + ' &rarr;</a></p>'

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
    detail[src.name] = 'added=' + added + ' img=' + withImg
  }

  if (total > 0) { try { revalidatePath('/actualites', 'layout') } catch { /* noop */ } }
  return NextResponse.json({ ok: true, imported: total, detail, at: new Date().toISOString() })
}
