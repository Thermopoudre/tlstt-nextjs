import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const revalidate = 3600

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('news')
    .select('id, title, excerpt, content, category, created_at, image_url')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30)

  const categoryLabels: Record<string, string> = {
    club: 'Club',
    tt: 'Tennis de Table',
    handi: 'Handisport',
  }

  const items = (articles || [])
    .map((a) => {
      const url = `${SITE_URL}/actualites/${a.category}/${a.id}`
      const description = a.excerpt || a.content?.replace(/<[^>]+>/g, '').substring(0, 200) || ''
      const date = new Date(a.created_at).toUTCString()
      const category = categoryLabels[a.category] || a.category

      return `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${date}</pubDate>
      <category>${escapeXml(category)}</category>${a.image_url ? `\n      <enclosure url="${escapeXml(a.image_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TLSTT — Actualités</title>
    <link>${SITE_URL}</link>
    <description>Toutes les actualités du club de tennis de table TLSTT Toulon La Seyne.</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/icon-512.png</url>
      <title>TLSTT</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
