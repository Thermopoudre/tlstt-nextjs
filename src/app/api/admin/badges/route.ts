import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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
