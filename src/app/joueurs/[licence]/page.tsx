import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PlayerProfileClient from '@/components/player/PlayerProfileClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

interface PlayerPageProps {
  params: Promise<{
    licence: string
  }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { licence } = await params
  const supabase = await createClient()

  // Récupérer le joueur depuis Supabase (affichage INSTANTANÉ)
  const { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('smartping_licence', licence)
    .single()

  if (error || !player) {
    notFound()
  }

  // Récupérer l'historique existant (optionnel)
  const { data: history } = await supabase
    .from('players_history')
    .select('*')
    .eq('player_id', player.id)
    .order('date', { ascending: false })
    .limit(12)

  // Passer les données initiales au composant client
  // Le composant gère le refresh en arrière-plan
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Joueurs', url: '/joueurs' },
        { name: `${player.first_name} ${player.last_name}`, url: `/joueurs/${licence}` },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: `${player.first_name} ${player.last_name}`,
        url: `${SITE_URL}/joueurs/${licence}`,
        memberOf: {
          '@type': 'SportsOrganization',
          name: 'TLSTT - Toulon La Seyne Tennis de Table',
          url: SITE_URL,
        },
      }} />
      <PlayerProfileClient
        initialPlayer={player}
        initialHistory={history || []}
      />
    </>
  )
}

// Metadata dynamique pour SEO
export async function generateMetadata({ params }: PlayerPageProps) {
  const { licence } = await params
  const supabase = await createClient()
  
  const { data: player } = await supabase
    .from('players')
    .select('first_name, last_name, fftt_points_exact, fftt_points')
    .eq('smartping_licence', licence)
    .single()

  if (!player) {
    return { title: 'Joueur non trouvé' }
  }

  const points = player.fftt_points_exact || player.fftt_points

  return {
    title: `${player.first_name} ${player.last_name} - ${points} pts`,
    description: `Profil et statistiques de ${player.first_name} ${player.last_name}, joueur licencié au TLSTT Toulon La Seyne Tennis de Table. Classement FFTT: ${points} points. Historique et progression.`,
    alternates: { canonical: `${SITE_URL}/joueurs/${licence}` },
    openGraph: {
      title: `${player.first_name} ${player.last_name} - ${points} pts | TLSTT`,
      description: `Joueur du TLSTT - Classement: ${points} points FFTT`,
      url: `${SITE_URL}/joueurs/${licence}`,
    },
    keywords: [player.first_name, player.last_name, 'joueur', 'TLSTT', 'tennis de table', 'classement FFTT'],
  }
}
