import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { estAppelAutorise } from '@/lib/api-auth'

/**
 * Purge mensuelle des statistiques de fréquentation.
 *
 * On garde 13 mois glissants : assez pour comparer une saison à la précédente
 * (« combien de visites en septembre dernier ? »), sans laisser la table
 * grossir indéfiniment. Les données étant déjà anonymes, il n'y a rien à
 * conserver au-delà.
 */
export async function GET(req: NextRequest) {
  if (!(await estAppelAutorise(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const limite = new Date()
  limite.setMonth(limite.getMonth() - 13)
  const limiteIso = limite.toISOString().slice(0, 10)

  const service = createAdminClient()

  const { count: avant } = await service
    .from('audience_events')
    .select('*', { count: 'exact', head: true })

  const { error } = await service
    .from('audience_events')
    .delete()
    .lt('jour', limiteIso)

  if (error) {
    console.error('[purge-statistiques] échec :', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { count: apres } = await service
    .from('audience_events')
    .select('*', { count: 'exact', head: true })

  const supprimes = (avant ?? 0) - (apres ?? 0)
  console.log(`[purge-statistiques] ${supprimes} événement(s) antérieurs au ${limiteIso} supprimés`)

  return NextResponse.json({
    ok: true,
    limite: limiteIso,
    supprimes,
    restants: apres ?? 0,
  })
}
