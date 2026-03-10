import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admins').select('id').eq('id', user.id).single()
  return data ? user : null
}

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json({ error: 'Le champ message est requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        message: body.message,
        type: body.type || 'info',
        link_url: body.link_url || null,
        link_label: body.link_label || null,
        is_active: body.is_active ?? true,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
