import { NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'

// Diagnostic du bandeau d'alerte : compare ce que voit le site public (clé
// anonyme + RLS) et ce qu'il y a réellement en base. Réservé aux admins.
export async function GET() {
  const sb = await createReadOnlyClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: admin } = await sb.from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
  if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

  const publicClient = createPublicClient()
  const vuePublique = await publicClient
    .from('alerts')
    .select('id, message, type, is_active, starts_at, ends_at')
    .eq('is_active', true)
    .order('id', { ascending: false })

  const service = createAdminClient()
  const enBase = await service
    .from('alerts')
    .select('id, is_active, starts_at, ends_at')
    .order('id', { ascending: false })

  return NextResponse.json({
    maintenant: new Date().toISOString(),
    envUrl: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 40),
    anonKeyPresente: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    vuePublique: { lignes: vuePublique.data?.length ?? null, erreur: vuePublique.error?.message ?? null, donnees: vuePublique.data },
    enBase: { lignes: enBase.data?.length ?? null, erreur: enBase.error?.message ?? null, donnees: enBase.data },
  })
}
