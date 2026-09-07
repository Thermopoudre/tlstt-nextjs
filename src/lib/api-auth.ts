import type { NextRequest } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'

/**
 * Autorisation commune des routes de synchronisation / maintenance.
 *
 * Accepte :
 *  1. un appel portant le secret : `Authorization: Bearer <CRON_SECRET>` ;
 *  2. la tâche planifiée Vercel (en-tête `x-vercel-cron`) ;
 *  3. un administrateur actif connecté (déclenchement depuis le back-office).
 *
 * Historique : l'en-tête Vercel n'était accepté qu'en l'absence de CRON_SECRET,
 * parce qu'il est falsifiable. Résultat : dès que le secret a été ajouté à
 * l'hébergement, **toutes les tâches planifiées se sont arrêtées en silence**
 * (401) — synchronisation des joueurs et import des actualités compris.
 * On rétablit donc l'en-tête, et on borne l'abus autrement : une même route ne
 * peut pas être relancée plus d'une fois par quart d'heure sans le secret.
 */

const dernierAppel = new Map<string, number>()
const INTERVALLE_MINIMAL_MS = 15 * 60 * 1000

export async function estAppelAutorise(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET

  // 1. Appel signé : toujours accepté, sans limite de fréquence.
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true

  // 2. Tâche planifiée Vercel : acceptée, mais pas plus d'une fois par quart
  //    d'heure et par route (une éventuelle relance forcée depuis l'extérieur
  //    ne peut donc pas marteler l'API de la fédération).
  if (req.headers.get('x-vercel-cron')) {
    const cle = new URL(req.url).pathname
    const maintenant = Date.now()
    const precedent = dernierAppel.get(cle) ?? 0
    if (maintenant - precedent < INTERVALLE_MINIMAL_MS) return false
    dernierAppel.set(cle, maintenant)
    return true
  }

  // 3. Administrateur connecté (bouton « Synchroniser » du back-office).
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
