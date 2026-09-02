import type { NextRequest } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'

/**
 * Autorisation commune des routes de synchronisation / maintenance.
 *
 * Accepte, dans l'ordre :
 *  1. la tâche planifiée Vercel (en-tête `x-vercel-cron`) — uniquement tant
 *     qu'aucun CRON_SECRET n'est configuré (mode dégradé, cet en-tête étant
 *     falsifiable) ;
 *  2. un appel portant le secret : `Authorization: Bearer <CRON_SECRET>` ;
 *  3. un administrateur actif connecté (déclenchement depuis le back-office).
 *
 * Tout le reste est refusé. Avant, ces routes étaient ouvertes à quiconque dès
 * que CRON_SECRET manquait dans l'hébergement.
 */
export async function estAppelAutorise(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET

  if (secret) {
    if (req.headers.get('authorization') === `Bearer ${secret}`) return true
  } else if (req.headers.get('x-vercel-cron')) {
    return true
  }

  try {
    const sb = await createReadOnlyClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user?.email) return false
    const { data } = await sb
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()
    return !!data
  } catch {
    return false
  }
}
