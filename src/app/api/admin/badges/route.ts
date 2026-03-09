import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admins').select('id').eq('id', user.id).single()
  return data ? user : null
}

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ membres: 0, messages: 0 }, { status: 401 })
  }
  try {
    const supabase = await createClient()

    const [{ count: membres }, { count: messages }] = await Promise.all([
      supabase
        .from('member_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'pending'),
      supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false),
    ])

    return NextResponse.json({ membres: membres ?? 0, messages: messages ?? 0 })
  } catch {
    return NextResponse.json({ membres: 0, messages: 0 })
  }
}
