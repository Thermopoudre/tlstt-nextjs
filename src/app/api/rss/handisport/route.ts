import { NextResponse } from 'next/server'

export async function GET() {
  // RSS Handisport - actualités handi TT
  const rssFeedUrl = 'https://www.handisport.org/category/tennis-de-table/feed/'

  try {
    const response = await fetch(rssFeedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 3600 } // Cache 1h
    })

    if (!response.ok) {
      throw new Error('RSS fetch failed')
    }

    const rssData = await response.text()

    // Parser le XML basiquement
    const items: any[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    const itemMatches = rssData.matchAll(itemRegex)

    for (const match of itemMatches) {
      const itemContent = match[1]
      
      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                    itemContent.match(/<title>(.*?)<\/title>/)?.[1] || ''
      
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
      
      const description = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                         itemContent.match(/<description>(.*?)<\/description>/)?.[1] || ''
      
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      items.push({
        title: title.trim(),
        link: link.trim(),
        description: description.trim().substring(0, 200).replace(/<[^>]*>/g, ''),
        pubDate: pubDate.trim(),
      })

      if (items.length >= 10) break
    }

    return NextResponse.json({ 
      success: true,
      source: 'Handisport',
      items,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false,
      items: [],
    }, { status: 500 })
  }
}
