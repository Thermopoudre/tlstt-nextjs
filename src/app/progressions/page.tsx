'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { TableSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'

interface PlayerProgression {
  id: string
  licence: string
  nom: string
  prenom: string
  pointsActuels: number
  pointsAnciens: number
  pointsInitiaux: number
  progressionMois: number
  progressionSaison: number
  progressionPourcentage: number
  categorie: string | null
  palierAtteint?: number
}

interface Stats {
  recordMois: PlayerProgression | null
  enProgression: number
  enRegression: number
  stables: number
  total: number
  nouveauxPaliers?: PlayerProgression[]
}

export default function ProgressionsPage() {
  const [topMois, setTopMois] = useState<PlayerProgression[]>([])
  const [topSaison, setTopSaison] = useState<PlayerProgression[]>([])
  const [tous, setTous] = useState<PlayerProgression[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState('')
  const [ffttStatus, setFfttStatus] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'classement' | 'progression'>('classement')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/progressions', { cache: 'no-store' })
        const data = await response.json()
        setTopMois(data.topMois || [])
        setTopSaison(data.topSaison || [])
        setTous(data.tous || [])
        setStats(data.stats || null)
        setSource(data.source || '')
        setFfttStatus(data.ffttStatus || '')
        setLastUpdate(data.lastUpdate || '')
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredPlayers = tous.filter(p =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    p.licence?.includes(search)
  )

  // Top 3 du classement
  const top3 = filteredPlayers.slice(0, 3)
  
  // Meilleure progression du mois
  const bestProgression = topMois[0]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />

          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
              <i className="fas fa-chart-line mr-3 text-[#3b9fd8]"></i>
              <span className="text-[#3b9fd8]">CLASSEMENT</span> & PROGRESSIONS
            </h1>
            <p className="text-xl text-gray-400">Classement des joueurs et suivi des progressions</p>
            
            {/* Status badge */}
            <div className="flex justify-center mt-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                source === 'FFTT Live' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                <i className={`fas fa-${source === 'FFTT Live' ? 'check-circle' : 'database'} mr-2`}></i>
                {source || 'Chargement...'}
              </span>
            </div>
            
            {lastUpdate && (
              <p className="text-xs text-gray-600 mt-3">
                <i className="fas fa-clock mr-1"></i>
                Dernière mise à jour : {new Date(lastUpdate).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-[#3b9fd8] rounded-full mx-auto mb-2 flex items-center justify-center">
                <i className="fas fa-users text-lg text-white"></i>
              </div>
              <p className="text-3xl font-bold text-[#3b9fd8]">{stats?.total || 0}</p>
              <p className="text-sm text-gray-400">Joueurs</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <i className="fas fa-arrow-up text-lg text-white"></i>
              </div>
              <p className="text-3xl font-bold text-green-400">{stats?.enProgression || 0}</p>
              <p className="text-sm text-gray-400">En hausse</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <i className="fas fa-arrow-down text-lg text-white"></i>
              </div>
              <p className="text-3xl font-bold text-red-400">{stats?.enRegression || 0}</p>
              <p className="text-sm text-gray-400">En baisse</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                <i className="fas fa-minus text-lg text-white"></i>
              </div>
              <p className="text-3xl font-bold text-gray-400">{stats?.stables || 0}</p>
              <p className="text-sm text-gray-500">Stables</p>
            </div>
            {bestProgression && bestProgression.progressionMois > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <i className="fas fa-fire text-lg text-white"></i>
                </div>
                <p className="text-xl font-bold text-yellow-400">+{bestProgression.progressionMois}</p>
                <p className="text-xs text-gray-400 truncate">{bestProgression.prenom} {bestProgression.nom}</p>
              </div>
            )}
          </div>
        )}

        {/* Top 3 Podium */}
        {!isLoading && top3.length >= 3 && !search && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 text-white">
              <i className="fas fa-medal mr-2 text-yellow-500"></i>
              <span className="text-[#3b9fd8]">TOP 3</span> DU CLUB
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[1, 0, 2].map((idx, order) => {
                const player = top3[idx]
                if (!player) return null
                const medals = ['🥈', '🥇', '🥉']
                const positions = ['2e', '1er', '3e']
                const borderColors = ['border-gray-400', 'border-yellow-500', 'border-amber-600']
                const bgColors = ['bg-gray-500/10', 'bg-yellow-500/10', 'bg-amber-600/10']
                return (
                  <div
                    key={player.id}
                    className={`${bgColors[order]} border-2 ${borderColors[order]} rounded-2xl p-6 text-center ${order === 1 ? 'md:-mt-6 md:scale-105' : ''}`}
                  >
                    <div className="text-5xl mb-4">{medals[order]}</div>
                    <div className="text-xl font-bold text-white mb-2">{positions[order]}</div>
                    <div className="w-16 h-16 rounded-full bg-[#3b9fd8] flex items-center justify-center text-xl font-bold text-white mx-auto mb-4">
                      {player.prenom?.[0]}{player.nom?.[0]}
                    </div>
                    <h4 className="text-lg font-bold mb-1 text-white">{player.prenom} {player.nom}</h4>
                    <p className="text-gray-500 text-sm mb-3">{player.licence}</p>
                    <div className="text-3xl font-bold text-[#3b9fd8]">
                      {player.pointsActuels} <span className="text-lg text-gray-500">pts</span>
                    </div>
                    {player.progressionMois !== 0 && (
                      <div className={`mt-2 text-sm font-semibold ${player.progressionMois > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {player.progressionMois > 0 ? '+' : ''}{player.progressionMois} ce mois
                      </div>
                    )}
                    <Link
                      href={`/joueurs/${player.licence}`}
                      className="inline-block mt-4 px-5 py-2 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-all text-sm"
                    >
                      <i className="fas fa-user mr-2"></i>Profil
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('classement')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'classement'
                ? 'bg-[#3b9fd8] text-white'
                : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#3b9fd8]'
            }`}
          >
            <i className="fas fa-trophy mr-2"></i>
            Classement
          </button>
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'progression'
                ? 'bg-[#3b9fd8] text-white'
                : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#3b9fd8]'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            Progressions
          </button>
        </div>

        {/* Search */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-6">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#3b9fd8] focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : activeTab === 'classement' ? (
          /* Classement par points */
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#333] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fas fa-list-ol text-[#3b9fd8]"></i>
                Classement par Points
              </h2>
              <span className="text-sm text-gray-500">{filteredPlayers.length} joueurs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111] border-b border-[#333]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400 w-16">Rang</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Joueur</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Points</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400 hidden md:table-cell">Évolution</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400 hidden lg:table-cell">Catégorie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {filteredPlayers.slice(0, 50).map((player, index) => (
                    <tr key={player.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-[#333]'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/joueurs/${player.licence}`} className="hover:text-[#3b9fd8] transition-colors">
                          <p className="font-semibold text-white">{player.prenom} {player.nom}</p>
                          <p className="text-xs text-gray-500">{player.licence}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-[#3b9fd8] text-lg">{player.pointsActuels}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {player.progressionMois !== 0 ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            player.progressionMois > 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            <i className={`fas fa-arrow-${player.progressionMois > 0 ? 'up' : 'down'} mr-1`}></i>
                            {player.progressionMois > 0 ? '+' : ''}{player.progressionMois}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="px-2 py-1 bg-[#111] border border-[#333] rounded text-xs text-gray-400">
                          {player.categorie || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPlayers.length > 50 && (
              <div className="p-4 bg-[#111] text-center text-sm text-gray-500 border-t border-[#333]">
                Affichage des 50 premiers sur {filteredPlayers.length} joueurs
              </div>
            )}
          </div>
        ) : (
          /* Progressions du mois */
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#333] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fas fa-fire text-orange-500"></i>
                Meilleures Progressions
              </h2>
              <span className="text-sm text-gray-500">Ce mois</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111] border-b border-[#333]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400 w-16">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Joueur</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Points</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Progression</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400 hidden md:table-cell">Saison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {topMois.filter(p => p.progressionMois > 0).slice(0, 20).map((player, index) => (
                    <tr key={player.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-orange-500' :
                          index === 1 ? 'bg-orange-400' :
                          index === 2 ? 'bg-orange-300' :
                          'bg-[#333]'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/joueurs/${player.licence}`} className="hover:text-[#3b9fd8] transition-colors">
                          <p className="font-semibold text-white">{player.prenom} {player.nom}</p>
                          <p className="text-xs text-gray-500">{player.licence}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-white">{player.pointsActuels}</span>
                        <span className="text-gray-500 text-sm ml-1">pts</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-400">
                          <i className="fas fa-arrow-up mr-1"></i>
                          +{player.progressionMois}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className={`text-sm font-semibold ${
                          player.progressionSaison > 0 ? 'text-green-400' : 
                          player.progressionSaison < 0 ? 'text-red-400' : 'text-gray-500'
                        }`}>
                          {player.progressionSaison > 0 ? '+' : ''}{player.progressionSaison}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {topMois.filter(p => p.progressionMois > 0).length === 0 && (
              <div className="p-12 text-center">
                <i className="fas fa-chart-line text-6xl text-gray-600 mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">Pas de progression ce mois</h3>
                <p className="text-gray-500">Les données seront mises à jour prochainement</p>
              </div>
            )}
          </div>
        )}

        {/* Nouveaux paliers */}
        {stats?.nouveauxPaliers && stats.nouveauxPaliers.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              <i className="fas fa-award text-purple-400 mr-2"></i>
              Nouveaux Paliers Atteints
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.nouveauxPaliers.map(player => (
                <Link
                  key={player.id}
                  href={`/joueurs/${player.licence}`}
                  className="bg-[#1a1a1a] border border-purple-500/30 rounded-lg px-4 py-2 hover:border-purple-500 transition-colors"
                >
                  <span className="text-white font-semibold">{player.prenom} {player.nom}</span>
                  <span className="text-purple-400 ml-2 font-bold">{player.palierAtteint} pts</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
