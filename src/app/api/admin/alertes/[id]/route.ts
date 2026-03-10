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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }
    const supabase = createAdminClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('alerts')
      .update({
        message: body.message,
        type: body.type,
        link_url: body.link_url || null,
        link_label: body.link_label || null,
        is_active: body.is_active,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', numId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', numId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return new Response(null, { status: 204 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
