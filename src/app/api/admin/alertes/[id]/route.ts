import { createClient } from '@/lib/supabase/server'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
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
    .eq('id', parseInt(id))
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', parseInt(id))

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return new Response(null, { status: 204 })
}
