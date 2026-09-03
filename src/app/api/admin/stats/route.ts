import { NextRequest, NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Statistiques de fréquentation — réservé aux administrateurs actifs. */
export async function GET(req: NextRequest) {
  const sb = await createReadOnlyClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: admin } = await sb
    .from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
  if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

  const periode = req.nextUrl.searchParams.get('periode') || 'mois'
  const config: Record<string, { jours: number; granularite: string }> = {
    semaine: { jours: 7, granularite: 'jour' },
    mois: { jours: 30, granularite: 'jour' },
    trimestre: { jours: 90, granularite: 'semaine' },
    annee: { jours: 365, granularite: 'mois' },
  }
  const { jours, granularite } = config[periode] || config.mois

  const depuis = new Date()
  depuis.setDate(depuis.getDate() - (jours - 1))
  const depuisIso = depuis.toISOString().slice(0, 10)

  const service = createAdminClient()
  const { data, error } = await service.rpc('stats_audience', { depuis: depuisIso, granularite })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Comparaison avec la période précédente (même durée)
  const precedent = new Date(depuis)
  precedent.setDate(precedent.getDate() - jours)
  const { data: dataPrec } = await service.rpc('stats_audience', {
    depuis: precedent.toISOString().slice(0, 10),
    granularite,
  })
  const totalPrecCumul = (dataPrec as { total?: { visites?: number } } | null)?.total?.visites ?? 0
  const totalActuel = (data as { total?: { visites?: number } } | null)?.total?.visites ?? 0
  // La période précédente seule = cumul des deux périodes − période actuelle
  const visitesPrecedentes = Math.max(0, totalPrecCumul - totalActuel)

  return NextResponse.json({ periode, jours, depuis: depuisIso, visitesPrecedentes, ...(data as object) })
}
