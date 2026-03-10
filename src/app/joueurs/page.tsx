import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import JoueursClient from './JoueursClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

// Revalider toutes les heures (les points FFTT changent 2x/mois, sync SmartPing quotidien)
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Joueurs - Classement des Licenciés',
  description: 'Découvrez tous les joueurs licenciés du club TLSTT Toulon La Seyne Tennis de Table, leurs classements FFTT et leurs points actuels. Données officielles en temps réel.',
  alternates: { canonical: `${SITE_URL}/joueurs` },
  keywords: ['joueurs', 'classement', 'FFTT', 'licenciés', 'TLSTT', 'tennis de table', 'points', 'Toulon', 'La Seyne'],
  openGraph: {
    title: 'Joueurs TLSTT - Classement Officiel FFTT',
    description: 'Classement des joueurs du club de tennis de table TLSTT - Données FFTT en temps réel',
    url: `${SITE_URL}/joueurs`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Joueurs TLSTT - Classement FFTT' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joueurs TLSTT - Classement Officiel FFTT',
    description: 'Classement des joueurs du club de tennis de table TLSTT - Données FFTT en temps réel',
    images: [`${SITE_URL}/og-image.png`],
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
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 text-center max-w-md">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h1 className="text-xl font-bold text-white mb-2">Erreur de chargement</h1>
          <p className="text-red-400 text-sm">Impossible de récupérer la liste des joueurs. Réessayez ultérieurement.</p>
        </div>
      </div>
    )
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

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Joueurs', url: '/joueurs' },
      ])} />
      <JoueursClient initialPlayers={formattedPlayers} />
    </>
  )
}
