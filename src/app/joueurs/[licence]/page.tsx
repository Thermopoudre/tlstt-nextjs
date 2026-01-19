import { createClient } from '@/lib/supabase/server'
import { SmartPingAPI } from '@/lib/smartping/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GraphiqueProgression from '@/components/player/GraphiqueProgression'

interface PlayerPageProps {
  params: Promise<{
    licence: string
  }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { licence } = await params
  const supabase = await createClient()

  // Récupérer le joueur depuis Supabase
  const { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('smartping_licence', licence)
    .single()

  if (error || !player) {
    notFound()
  }

  // Récupérer l'historique depuis Supabase
  const { data: history } = await supabase
    .from('players_history')
    .select('*')
    .eq('player_id', player.id)
    .order('date', { ascending: false })
    .limit(12) // 12 derniers mois

  // Calculer la progression
  const progression = history && history.length >= 2
    ? history[0].fftt_points - history[history.length - 1].fftt_points
    : 0

  // Récupérer les statistiques depuis l'API SmartPing
  const api = new SmartPingAPI()
  let stats = null
  try {
    stats = await api.getStatsJoueur(licence)
  } catch (e) {
    // En cas d'erreur API, on continue sans les stats
    console.error('Erreur stats joueur:', e)
  }

  return (
    <div className="container-custom">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-600 hover:text-primary">
              Accueil
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/joueurs" className="text-gray-600 hover:text-primary">
              Joueurs
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-semibold">
            {player.first_name} {player.last_name}
          </li>
        </ol>
      </nav>

      {/* Header du joueur */}
      <div className="card mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold">
            {player.first_name[0]}{player.last_name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-primary mb-2">
              {player.first_name} {player.last_name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                <i className="fas fa-id-card"></i>
                Licence: {player.smartping_licence}
              </span>
              {player.category && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <i className="fas fa-user-tag"></i>
                    {player.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-2">Classement actuel</div>
          <div className="text-4xl font-bold text-primary">
            {player.fftt_points_exact || player.fftt_points}
          </div>
          <div className="text-sm text-gray-500 mt-1">points</div>
        </div>
        
        <div className="card text-center border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-2">Progression</div>
          <div className={`text-4xl font-bold ${progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {progression > 0 ? '+' : ''}{progression}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {history && history.length >= 2 ? '12 derniers mois' : 'N/A'}
          </div>
        </div>

        <div className="card text-center border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-2">Meilleur classement</div>
          <div className="text-4xl font-bold text-yellow-600">
            {history && history.length > 0
              ? Math.max(...history.map(h => h.fftt_points))
              : player.fftt_points_exact || player.fftt_points}
          </div>
          <div className="text-sm text-gray-500 mt-1">points</div>
        </div>

        <div className="card text-center border-l-4 border-cyan-500">
          <div className="text-sm text-gray-600 mb-2">Matchs joués</div>
          <div className="text-4xl font-bold text-cyan-600">
            {stats?.total || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">parties</div>
        </div>
      </div>

      {/* Statistiques de parties */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-green-50 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Victoires</p>
                <p className="text-3xl font-bold text-green-600">{stats.victoires}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-trophy text-3xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="card bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Défaites</p>
                <p className="text-3xl font-bold text-red-600">{stats.defaites}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-times-circle text-3xl text-red-600"></i>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Taux de victoire</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pourcentage}%</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-pie text-3xl text-blue-600"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphique de progression */}
      {history && history.length > 1 && (
        <GraphiqueProgression history={history} />
      )}

      {/* Historique */}
      {history && history.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-4">
            <i className="fas fa-history mr-2"></i>
            Historique des classements
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Points</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Évolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((point, index) => {
                  const prevPoints = history[index + 1]?.fftt_points
                  const diff = prevPoints ? point.fftt_points - prevPoints : 0

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(point.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-primary">
                        {point.fftt_points}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {diff !== 0 && (
                          <span className={`inline-flex items-center gap-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <i className={`fas fa-arrow-${diff > 0 ? 'up' : 'down'}`}></i>
                            {Math.abs(diff)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
