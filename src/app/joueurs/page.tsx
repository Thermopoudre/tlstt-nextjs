import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function JoueursPage() {
  const supabase = await createClient()

  // Récupérer tous les joueurs TLSTT (admin_notes contient 'TLSTT')
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .ilike('admin_notes', '%TLSTT%')
    .order('fftt_points_exact', { ascending: false })

  if (error) {
    console.error('Erreur Supabase:', error)
  }

  // Grouper les joueurs par catégorie
  const playersByCategory = players?.reduce((acc, player) => {
    const cat = player.category || 'Autres'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(player)
    return acc
  }, {} as Record<string, typeof players>)

  const categories = playersByCategory ? Object.keys(playersByCategory).sort() : []

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Nos Joueurs
        </h1>
        <p className="text-lg text-gray-600">
          Découvrez tous les licenciés du club TLSTT, leurs classements et progressions
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {players?.length || 0}
          </div>
          <div className="text-gray-600">Licenciés</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-secondary mb-2">
            {players?.filter(p => p.category?.includes('Senior')).length || 0}
          </div>
          <div className="text-gray-600">Seniors</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-accent-cyan mb-2">
            {players?.filter(p => p.category?.includes('Junior') || p.category?.includes('Cadet')).length || 0}
          </div>
          <div className="text-gray-600">Jeunes</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-accent-yellow mb-2">
            {players ? Math.round(players.reduce((sum, p) => sum + (p.fftt_points_exact || 0), 0) / players.length) : 0}
          </div>
          <div className="text-gray-600">Points moyen</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-8">
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary">
            Tous
          </button>
          {categories.map(cat => (
            <button key={cat} className="btn-secondary">
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des joueurs */}
      {players && players.length > 0 ? (
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="card">
              <h2 className="text-2xl font-bold text-primary mb-4 border-b pb-2">
                {category}
                <span className="text-sm text-gray-500 ml-2">
                  ({playersByCategory![category].length} joueurs)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playersByCategory![category].map((player: any) => (
                  <Link
                    key={player.id}
                    href={`/joueurs/${player.smartping_licence}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                      {player.first_name[0]}{player.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary group-hover:text-secondary transition-colors">
                        {player.first_name} {player.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-secondary">
                          {player.fftt_points_exact || player.fftt_points} pts
                        </span>
                        {player.category && (
                          <span className="text-gray-400">•</span>
                        )}
                        {player.category && (
                          <span>{player.category}</span>
                        )}
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 group-hover:text-secondary transition-colors"></i>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">
            Aucun joueur trouvé
          </h2>
          <p className="text-gray-500">
            Les données des joueurs seront bientôt disponibles
          </p>
        </div>
      )}
    </div>
  )
}
