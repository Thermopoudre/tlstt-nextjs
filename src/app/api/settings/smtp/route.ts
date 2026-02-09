import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_secure',
  'smtp_user',
  'smtp_pass',
  'smtp_from',
  'smtp_admin_email',
]

/**
 * GET - Lire la configuration SMTP (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Acces admin requis' }, { status: 403 })
    }

    const { data: settings } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .in('setting_key', SMTP_KEYS)

    const config: Record<string, string> = {}
    settings?.forEach((s: { setting_key: string; setting_value: string | null }) => {
      config[s.setting_key] = s.setting_value || ''
    })

    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST - Sauvegarder la configuration SMTP (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Acces admin requis' }, { status: 403 })
    }

    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'config invalide' }, { status: 400 })
    }

    // Upsert each setting
    for (const key of SMTP_KEYS) {
      if (key in config) {
        await supabase
          .from('settings')
          .upsert(
            {
              setting_key: key,
              setting_value: config[key] || '',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'setting_key' }
          )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
