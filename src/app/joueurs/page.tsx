import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import JoueursClient from './JoueursClient'

export const metadata: Metadata = {
  title: 'Joueurs - Classement des Licenciés | TLSTT',
  description: 'Découvrez tous les joueurs licenciés du club TLSTT Toulon La Seyne Tennis de Table, leurs classements FFTT et leurs points actuels.',
  openGraph: {
    title: 'Joueurs TLSTT - Classement Officiel',
    description: 'Classement des joueurs du club de tennis de table TLSTT - Données FFTT en temps réel',
  },
}

export default async function JoueursPage() {
  const supabase = await createClient()

  // Récupérer tous les joueurs avec leurs points
  const { data: players, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, smartping_licence, fftt_points, fftt_points_exact, fftt_category, category, admin_notes')
    .order('fftt_points_exact', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Erreur chargement joueurs:', error)
  }

  // Formater les données pour le composant client
  const formattedPlayers = (players || []).map(player => ({
    id: player.id,
    first_name: player.first_name || '',
    last_name: player.last_name || '',
    smartping_licence: player.smartping_licence || '',
    fftt_points: player.fftt_points,
    fftt_points_exact: player.fftt_points_exact,
    fftt_category: player.fftt_category,
    category: player.category,
    admin_notes: player.admin_notes
  }))

  return <JoueursClient initialPlayers={formattedPlayers} />
}
