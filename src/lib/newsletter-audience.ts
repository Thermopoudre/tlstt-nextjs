import { createAdminClient } from '@/lib/supabase/admin'

export type Audience = { type: 'all' } | { type: 'members' } | { type: 'subscribers' } | { type: 'group'; id: number }

export function parseAudience(raw: unknown): Audience {
  const s = String(raw || 'all')
  if (s === 'members' || s === 'subscribers') return { type: s }
  const m = s.match(/^group:(\d+)$/)
  if (m) return { type: 'group', id: Number(m[1]) }
  return { type: 'all' }
}

export function audienceKey(a: Audience): string {
  return a.type === 'group' ? `group:${a.id}` : a.type
}

/** Emails des membres validés du site (via auth.users), indexés par id. */
async function emailsParMembre(): Promise<Map<string, string>> {
  const service = createAdminClient()
  const map = new Map<string, string>()
  let page = 1
  for (;;) {
    const { data: liste } = await service.auth.admin.listUsers({ page, perPage: 200 })
    const users = liste?.users || []
    for (const u of users) if (u.email) map.set(u.id, u.email.toLowerCase())
    if (users.length < 200 || page > 25) break
    page++
  }
  return map
}

/**
 * Résout une audience en liste d'adresses dédoublonnées.
 * - all         : tous les membres validés du site + abonnés du formulaire public
 * - members     : tous les membres validés du site
 * - subscribers : abonnés du formulaire public uniquement
 * - group:N     : membres du groupe N + adresses supplémentaires du groupe
 * Les membres du site reçoivent toujours la newsletter (décision du club, 03/09/2026).
 */
export async function resoudreAudience(a: Audience): Promise<{ emails: string[]; label: string; unsubscribable: Set<string> }> {
  const service = createAdminClient()
  const emails = new Set<string>()
  const unsubscribable = new Set<string>()
  let label = 'Tous les membres et abonnés'

  if (a.type === 'group') {
    const { data: groupe } = await service.from('newsletter_groups').select('id, name, extra_emails').eq('id', a.id).single()
    if (!groupe) return { emails: [], label: 'Groupe introuvable', unsubscribable }
    label = `Groupe « ${groupe.name} »`
    const { data: liens } = await service.from('newsletter_group_members').select('member_id').eq('group_id', a.id)
    const ids = new Set((liens || []).map(l => l.member_id))
    if (ids.size) {
      const map = await emailsParMembre()
      for (const id of ids) { const e = map.get(id); if (e) emails.add(e) }
    }
    for (const e of groupe.extra_emails || []) if (e) emails.add(String(e).toLowerCase().trim())
    return { emails: [...emails], label, unsubscribable }
  }

  if (a.type === 'all' || a.type === 'members') {
    const { data: membres } = await service.from('member_profiles').select('id').eq('is_validated', true)
    if (membres?.length) {
      const map = await emailsParMembre()
      for (const m of membres) { const e = map.get(m.id); if (e) emails.add(e) }
    }
    if (a.type === 'members') label = 'Tous les membres du site'
  }
  if (a.type === 'all' || a.type === 'subscribers') {
    const { data: abonnes } = await service.from('newsletter_subscribers').select('email').eq('is_subscribed', true)
    for (const s of abonnes || []) {
      if (!s.email) continue
      const e = String(s.email).toLowerCase()
      if (!emails.has(e)) unsubscribable.add(e)
      emails.add(e)
    }
    if (a.type === 'subscribers') label = 'Abonnés du formulaire public'
  }
  return { emails: [...emails], label, unsubscribable }
}
