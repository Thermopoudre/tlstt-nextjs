import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Player {
  id: string
  first_name: string
  last_name: string
  fftt_points: number
  fftt_points_exact: number | null
  smartping_licence: string
  category: string | null
}

export default async function JoueursPage() {
  const supabase = await createClient()

  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .order('fftt_points_exact', { ascending: false, nullsFirst: false })

  // Stats
  const totalPlayers = players?.length || 0
  const top1000 = players?.filter(p => (p.fftt_points_exact || p.fftt_points || 500) >= 1000).length || 0
  const avgPoints = players?.length 
    ? Math.round(players.reduce((sum, p) => sum + (p.fftt_points_exact || p.fftt_points || 500), 0) / players.length)
    : 0

  // Top 3 joueurs
  const top3 = players?.slice(0, 3) || []

  return (
    <div className="bg-[#0f3057] min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        <Breadcrumbs className="text-gray-400 mb-6" />
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <i className="fas fa-table-tennis-paddle-ball text-4xl text-[#5bc0de]"></i>
            <h1 className="text-4xl font-bold text-[#5bc0de] tracking-wider">JOUEURS</h1>
          </div>
          <p className="text-gray-300">L'effectif complet du club TLSTT classé par niveau</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a5a8a]/50 rounded-xl p-4 text-center border border-[#5bc0de]/20">
            <i className="fas fa-users text-2xl text-[#5bc0de] mb-2"></i>
            <p className="text-3xl font-bold text-white">{totalPlayers}</p>
            <p className="text-sm text-gray-400">Joueurs Licenciés</p>
          </div>
          <div className="bg-[#1a5a8a]/50 rounded-xl p-4 text-center border border-[#5bc0de]/20">
            <i className="fas fa-trophy text-2xl text-yellow-500 mb-2"></i>
            <p className="text-3xl font-bold text-white">{top1000}</p>
            <p className="text-sm text-gray-400">Top 1000 France</p>
          </div>
          <div className="bg-[#1a5a8a]/50 rounded-xl p-4 text-center border border-[#5bc0de]/20">
            <i className="fas fa-star text-2xl text-[#5bc0de] mb-2"></i>
            <p className="text-3xl font-bold text-white">{avgPoints}</p>
            <p className="text-sm text-gray-400">Points Moyens</p>
          </div>
          <div className="bg-[#1a5a8a]/50 rounded-xl p-4 text-center border border-[#5bc0de]/20">
            <i className="fas fa-sync text-2xl text-green-500 mb-2"></i>
            <p className="text-xl font-bold text-green-400"><i className="fas fa-check"></i></p>
            <p className="text-sm text-gray-400">Sync FFTT</p>
          </div>
        </div>

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="mb-8">
            <h2 className="text-center text-xl font-bold text-white mb-6">
              <i className="fas fa-medal text-yellow-500 mr-2"></i>
              TOP 3
            </h2>
            <div className="flex justify-center items-end gap-4">
              {/* 2ème */}
              <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-xl p-4 w-32 text-center">
                <p className="text-2xl font-bold text-gray-800">2e</p>
                <div className="w-12 h-12 mx-auto bg-[#0f3057] rounded-full flex items-center justify-center text-white font-bold mt-2">
                  {top3[1]?.first_name?.[0]}{top3[1]?.last_name?.[0]}
                </div>
                <p className="text-xs text-gray-800 mt-2 font-medium truncate">{top3[1]?.first_name} {top3[1]?.last_name}</p>
                <p className="text-lg font-bold text-[#0f3057]">{top3[1]?.fftt_points_exact || top3[1]?.fftt_points} pts</p>
              </div>
              {/* 1er */}
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-xl p-4 w-36 text-center transform scale-110">
                <p className="text-3xl font-bold text-yellow-900">1er</p>
                <div className="w-14 h-14 mx-auto bg-[#0f3057] rounded-full flex items-center justify-center text-white font-bold mt-2 text-xl">
                  {top3[0]?.first_name?.[0]}{top3[0]?.last_name?.[0]}
                </div>
                <p className="text-sm text-yellow-900 mt-2 font-medium truncate">{top3[0]?.first_name} {top3[0]?.last_name}</p>
                <p className="text-xl font-bold text-[#0f3057]">{top3[0]?.fftt_points_exact || top3[0]?.fftt_points} pts</p>
              </div>
              {/* 3ème */}
              <div className="bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-xl p-4 w-32 text-center">
                <p className="text-2xl font-bold text-amber-100">3e</p>
                <div className="w-12 h-12 mx-auto bg-[#0f3057] rounded-full flex items-center justify-center text-white font-bold mt-2">
                  {top3[2]?.first_name?.[0]}{top3[2]?.last_name?.[0]}
                </div>
                <p className="text-xs text-amber-100 mt-2 font-medium truncate">{top3[2]?.first_name} {top3[2]?.last_name}</p>
                <p className="text-lg font-bold text-amber-100">{top3[2]?.fftt_points_exact || top3[2]?.fftt_points} pts</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des joueurs */}
      <div className="bg-gray-100 rounded-t-3xl min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-5 py-8">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Rechercher un joueur..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 bg-[#5bc0de] text-white rounded-lg font-medium">
                  <i className="fas fa-trophy mr-2"></i>Classement
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                  <i className="fas fa-sort-alpha-down mr-2"></i>A - Z
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Rang</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Joueur</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-600">Points</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600 hidden md:table-cell">Cat.</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {players?.slice(0, 50).map((player, index) => (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-[#0f3057]'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/joueurs/${player.smartping_licence}`} className="hover:text-[#5bc0de]">
                        <p className="font-semibold text-gray-900">{player.first_name} {player.last_name}</p>
                        <p className="text-xs text-gray-500">{player.smartping_licence}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-[#0f3057] text-lg">
                        {player.fftt_points_exact || player.fftt_points || 500}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                        {player.category || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {players && players.length > 50 && (
              <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                Affichage des 50 premiers joueurs sur {players.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
