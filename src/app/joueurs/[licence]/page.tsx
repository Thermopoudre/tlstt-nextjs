import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PlayerProfileClient from '@/components/player/PlayerProfileClient'

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
    <PlayerProfileClient 
      initialPlayer={player} 
      initialHistory={history || []}
    />
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
    alternates: { canonical: `/joueurs/${licence}` },
    openGraph: {
      title: `${player.first_name} ${player.last_name} - ${points} pts | TLSTT`,
      description: `Joueur du TLSTT - Classement: ${points} points FFTT`,
      url: `/joueurs/${licence}`,
    },
    keywords: [player.first_name, player.last_name, 'joueur', 'TLSTT', 'tennis de table', 'classement FFTT'],
  }
}
