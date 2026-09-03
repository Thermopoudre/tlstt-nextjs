import { NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Annuaire des membres du site (avec adresse email) — réservé aux administrateurs.
 * Les adresses vivent dans auth.users : on les joint ici côté serveur, jamais côté client.
 */
export async function GET() {
  const sb = await createReadOnlyClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: admin } = await sb.from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
  if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

  const service = createAdminClient()
  const { data: profils } = await service
    .from('member_profiles')
    .select('id, first_name, last_name, role, membership_status, is_validated')
    .order('last_name', { ascending: true })

  const emails = new Map<string, string>()
  let page = 1
  for (;;) {
    const { data: liste } = await service.auth.admin.listUsers({ page, perPage: 200 })
    const users = liste?.users || []
    for (const u of users) if (u.email) emails.set(u.id, u.email)
    if (users.length < 200 || page > 25) break
    page++
  }

  const membres = (profils || []).map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: emails.get(p.id) || null,
    role: p.role,
    membership_status: p.membership_status,
    is_validated: p.is_validated,
  }))
  return NextResponse.json({ membres })
}
