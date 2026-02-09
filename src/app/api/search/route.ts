import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], query: q })
  }

  const supabase = await createClient()
  const searchTerm = `%${q}%`

  const [{ data: articles }, { data: players }, { data: newsletters }] = await Promise.all([
    supabase
      .from('news')
      .select('id, title, category, excerpt, image_url, published_at')
      .eq('status', 'published')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('players')
      .select('id, first_name, last_name, smartping_licence, fftt_points')
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},smartping_licence.ilike.${searchTerm}`)
      .order('last_name')
      .limit(5),
    supabase
      .from('newsletters')
      .select('id, title, excerpt, published_at')
      .eq('status', 'published')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  const results = [
    ...(articles || []).map(a => ({
      type: 'article' as const,
      id: a.id,
      title: a.title,
      subtitle: a.excerpt?.substring(0, 100) || '',
      url: `/actualites/${a.category}/${a.id}`,
      image: a.image_url,
    })),
    ...(players || []).map(p => ({
      type: 'player' as const,
      id: p.id,
      title: `${p.first_name} ${p.last_name}`,
      subtitle: `${p.fftt_points || 500} pts${p.smartping_licence ? ` - Licence ${p.smartping_licence}` : ''}`,
      url: `/joueurs/${p.smartping_licence || p.id}`,
      image: null,
    })),
    ...(newsletters || []).map(n => ({
      type: 'newsletter' as const,
      id: n.id,
      title: n.title,
      subtitle: n.excerpt?.substring(0, 100) || '',
      url: `/newsletters/${n.id}`,
      image: null,
    })),
  ]

  return NextResponse.json({
    results,
    query: q,
    counts: {
      articles: articles?.length || 0,
      players: players?.length || 0,
      newsletters: newsletters?.length || 0,
    },
  })
}
