import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const newsId = parseInt(id)
  if (isNaN(newsId)) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const supabase = await createClient()

  const { count } = await supabase
    .from('news_likes')
    .select('*', { count: 'exact', head: true })
    .eq('news_id', newsId)

  const { data: { user } } = await supabase.auth.getUser()
  let hasLiked = false

  if (user) {
    const { data } = await supabase
      .from('news_likes')
      .select('id')
      .eq('news_id', newsId)
      .eq('user_id', user.id)
      .maybeSingle()
    hasLiked = !!data
  }

  return Response.json({ count: count || 0, hasLiked })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const newsId = parseInt(id)
  if (isNaN(newsId)) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // IP hash pour les non-connectés (fallback anonyme)
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const ipHash = createHash('sha256').update(ip + newsId).digest('hex').slice(0, 32)

  if (user) {
    // Utilisateur connecté : toggle like
    const { data: existing } = await supabase
      .from('news_likes')
      .select('id')
      .eq('news_id', newsId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('news_likes').delete().eq('id', existing.id)
      const { count } = await supabase
        .from('news_likes').select('*', { count: 'exact', head: true }).eq('news_id', newsId)
      return Response.json({ liked: false, count: count || 0 })
    } else {
      await supabase.from('news_likes').insert({ news_id: newsId, user_id: user.id })
      const { count } = await supabase
        .from('news_likes').select('*', { count: 'exact', head: true }).eq('news_id', newsId)
      return Response.json({ liked: true, count: count || 0 })
    }
  } else {
    // Anonyme : like par IP hash (pas de toggle)
    const { error } = await supabase.from('news_likes').insert({
      news_id: newsId,
      user_id: null,
      ip_hash: ipHash,
    })
    const { count } = await supabase
      .from('news_likes').select('*', { count: 'exact', head: true }).eq('news_id', newsId)
    return Response.json({ liked: !error, count: count || 0 })
  }
}
