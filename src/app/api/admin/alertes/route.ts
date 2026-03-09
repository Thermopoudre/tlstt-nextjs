import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
  return Response.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

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

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}
