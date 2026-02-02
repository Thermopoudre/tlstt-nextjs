'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

type Player = {
  id: string
  first_name: string
  last_name: string
  smartping_licence: string
  fftt_points: string | number | null
  fftt_points_exact: number | null
  fftt_category: string | null
  category: string | null
  admin_notes: string | null
}

type SortType = 'default' | 'name-asc' | 'name-desc' | 'points-asc' | 'points-desc'

function parseNationalRanking(category: string | null): { isNational: boolean; rank: number } {
  if (!category) return { isNational: false, rank: 0 }
  
  const categoryStr = String(category).trim()
  const nationalMatch = categoryStr.match(/^N\s*(\d+)$/i)
  if (nationalMatch) {
    return { isNational: true, rank: parseInt(nationalMatch[1]) }
  }
  
  return { isNational: false, rank: 0 }
}

function getPlayerPoints(player: Player): number {
  if (player.fftt_points_exact !== null && player.fftt_points_exact !== undefined) {
    const exact = Number(player.fftt_points_exact)
    if (!isNaN(exact) && exact > 0) return exact
  }
  if (player.fftt_points !== null && player.fftt_points !== undefined) {
    const points = Number(player.fftt_points)
    return isNaN(points) ? 500 : points
  }
  return 500
}

function getPlayerCategory(player: Player): string {
  return player.fftt_category || player.category || '-'
}

export default function JoueursClient({ initialPlayers }: { initialPlayers: Player[] }) {
  const [sortType, setSortType] = useState<SortType>('default')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = new Set<string>()
    initialPlayers.forEach(p => {
      const cat = getPlayerCategory(p)
      if (cat && cat !== '-') cats.add(cat)
    })
    return Array.from(cats).sort()
  }, [initialPlayers])

  const sortedPlayers = useMemo(() => {
    let filtered = [...initialPlayers]
    
    // Filtre recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.first_name?.toLowerCase().includes(term) ||
        p.last_name?.toLowerCase().includes(term) ||
        p.smartping_licence?.toLowerCase().includes(term)
      )
    }

    // Filtre catégorie
    if (categoryFilter) {
      filtered = filtered.filter(p => getPlayerCategory(p) === categoryFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      const rankA = parseNationalRanking(a.category)
      const rankB = parseNationalRanking(b.category)
      const pointsA = getPlayerPoints(a)
      const pointsB = getPlayerPoints(b)
      
      const nameA = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase()
      const nameB = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase()

      switch (sortType) {
        case 'name-asc':
          return nameA.localeCompare(nameB, 'fr')
        case 'name-desc':
          return nameB.localeCompare(nameA, 'fr')
        case 'points-asc':
          if (rankA.isNational && !rankB.isNational) return 1
          if (!rankA.isNational && rankB.isNational) return -1
          if (rankA.isNational && rankB.isNational) {
            return rankB.rank - rankA.rank
          }
          return pointsA - pointsB
        case 'points-desc':
        default:
          if (rankA.isNational && !rankB.isNational) return -1
          if (!rankA.isNational && rankB.isNational) return 1
          if (rankA.isNational && rankB.isNational) {
            return rankA.rank - rankB.rank
          }
          return pointsB - pointsA
      }
    })

    return filtered
  }, [initialPlayers, sortType, searchTerm, categoryFilter])

  // Statistiques
  const stats = useMemo(() => {
    const allPoints = initialPlayers.map(p => getPlayerPoints(p))
    const nationalCount = initialPlayers.filter(p => parseNationalRanking(p.category).isNational).length
    const avgPoints = initialPlayers.length > 0 
      ? Math.round(allPoints.reduce((sum, p) => sum + p, 0) / initialPlayers.length)
      : 0
    const maxPoints = allPoints.length > 0 ? Math.max(...allPoints) : 0
    const above1000 = allPoints.filter(p => p >= 1000).length
    const above1500 = allPoints.filter(p => p >= 1500).length
    const above2000 = allPoints.filter(p => p >= 2000).length
    
    return {
      total: initialPlayers.length,
      nationalCount,
      avgPoints,
      maxPoints,
      above1000,
      above1500,
      above2000
    }
  }, [initialPlayers])

  const sortButtons: { type: SortType; label: string; icon: string }[] = [
    { type: 'default', label: 'Classement', icon: 'fa-trophy' },
    { type: 'name-asc', label: 'A - Z', icon: 'fa-sort-alpha-down' },
    { type: 'name-desc', label: 'Z - A', icon: 'fa-sort-alpha-up' },
    { type: 'points-desc', label: 'Points ↓', icon: 'fa-sort-amount-down' },
    { type: 'points-asc', label: 'Points ↑', icon: 'fa-sort-amount-up' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
              <i className="fas fa-table-tennis-paddle-ball mr-3 text-[#3b9fd8]"></i>
              NOS <span className="text-[#3b9fd8]">JOUEURS</span>
            </h1>
            <p className="text-xl text-gray-400">L'effectif complet du club TLSTT classé par niveau</p>
            <p className="text-sm text-gray-500 mt-2">
              <i className="fas fa-sync mr-1 text-green-500"></i>
              Données synchronisées avec la FFTT
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-[#3b9fd8]/50 transition-colors">
            <div className="w-10 h-10 bg-[#3b9fd8] rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-users text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-[#3b9fd8] text-xs">Licenciés</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-yellow-500/50 transition-colors">
            <div className="w-10 h-10 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-crown text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.maxPoints}</div>
            <div className="text-yellow-500 text-xs">Meilleur</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-[#3b9fd8]/50 transition-colors">
            <div className="w-10 h-10 bg-[#3b9fd8] rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-chart-line text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.avgPoints}</div>
            <div className="text-[#3b9fd8] text-xs">Moyenne</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-purple-500/50 transition-colors">
            <div className="w-10 h-10 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-flag text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.nationalCount}</div>
            <div className="text-purple-400 text-xs">Nationaux</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-green-500/50 transition-colors">
            <div className="w-10 h-10 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-star text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.above2000}</div>
            <div className="text-green-400 text-xs">+2000 pts</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-blue-500/50 transition-colors">
            <div className="w-10 h-10 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-medal text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.above1500}</div>
            <div className="text-blue-400 text-xs">+1500 pts</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 text-center hover:border-orange-500/50 transition-colors">
            <div className="w-10 h-10 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-trophy text-lg text-white"></i>
            </div>
            <div className="text-3xl font-bold text-white">{stats.above1000}</div>
            <div className="text-orange-400 text-xs">+1000 pts</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-white">
                <i className="fas fa-search mr-2 text-[#3b9fd8]"></i>Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom, prénom ou licence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#3b9fd8] focus:outline-none focus:ring-1 focus:ring-[#3b9fd8]"
              />
            </div>
            {categories.length > 0 && (
              <div className="md:w-48">
                <label className="block text-sm font-semibold mb-2 text-white">
                  <i className="fas fa-filter mr-2 text-[#3b9fd8]"></i>Catégorie
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#3b9fd8] focus:outline-none"
                >
                  <option value="">Toutes</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-400 mr-2 self-center text-sm">Trier par :</span>
            {sortButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => setSortType(btn.type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  sortType === btn.type
                    ? 'bg-[#3b9fd8] text-white'
                    : 'bg-[#111] border border-[#333] text-gray-300 hover:border-[#3b9fd8] hover:text-[#3b9fd8]'
                }`}
              >
                <i className={`fas ${btn.icon} mr-2`}></i>{btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {sortedPlayers.length >= 3 && sortType === 'default' && !searchTerm && !categoryFilter && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 text-white">
              <i className="fas fa-medal mr-2 text-yellow-500"></i>
              <span className="text-[#3b9fd8]">TOP 3</span> DU CLUB
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[1, 0, 2].map((idx, order) => {
                const player = sortedPlayers[idx]
                if (!player) return null
                const ranking = parseNationalRanking(player.category)
                const points = getPlayerPoints(player)
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
                    <div className="w-20 h-20 rounded-full bg-[#3b9fd8] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                    <h4 className="text-xl font-bold mb-2 text-white">{player.first_name} {player.last_name}</h4>
                    <p className="text-gray-500 text-sm mb-3">{player.smartping_licence}</p>
                    {ranking.isNational && (
                      <div className="inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-3">
                        <i className="fas fa-flag mr-1"></i> N{ranking.rank} France
                      </div>
                    )}
                    <div className="text-3xl font-bold text-[#3b9fd8]">
                      {points} <span className="text-lg text-gray-500">pts</span>
                    </div>
                    <Link
                      href={`/joueurs/${player.smartping_licence}`}
                      className="inline-block mt-4 px-6 py-2 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-all"
                    >
                      <i className="fas fa-user mr-2"></i>Voir profil
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-white">
            <i className="fas fa-list mr-2 text-[#3b9fd8]"></i>
            Tous les joueurs
          </h4>
          <span className="bg-[#3b9fd8]/20 text-[#3b9fd8] px-4 py-2 rounded-full text-sm font-semibold">
            {sortedPlayers.length} joueur{sortedPlayers.length > 1 ? 's' : ''}
          </span>
        </div>

        {sortedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map((player, index) => {
              const ranking = parseNationalRanking(player.category)
              const points = getPlayerPoints(player)
              const category = getPlayerCategory(player)
              return (
                <Link
                  key={player.id}
                  href={`/joueurs/${player.smartping_licence}`}
                  className={`bg-[#1a1a1a] border rounded-2xl p-5 hover:-translate-y-1 hover:border-[#3b9fd8] transition-all group relative ${
                    ranking.isNational ? 'border-purple-500/50' : 'border-[#333]'
                  }`}
                >
                  {ranking.isNational && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        <i className="fas fa-flag mr-1"></i>N{ranking.rank}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#111] px-2 py-1 rounded text-xs text-gray-500 border border-[#333]">
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="w-16 h-16 rounded-full bg-[#3b9fd8] flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white group-hover:text-[#3b9fd8] transition-colors truncate">
                        {player.first_name} {player.last_name}
                      </h3>
                      <div className="text-gray-500 text-sm">
                        <i className="fas fa-id-card mr-1"></i>{player.smartping_licence}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <div className="text-3xl font-bold text-[#3b9fd8]">
                        {points}
                      </div>
                      <div className="text-gray-500 text-xs">points officiels</div>
                    </div>
                    {category !== '-' && !ranking.isNational && (
                      <span className="bg-[#111] text-gray-400 px-3 py-1 rounded-full text-xs border border-[#333]">
                        {category}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 text-center">
            <i className="fas fa-search text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-2xl font-bold text-white mb-2">Aucun joueur trouvé</h3>
            <p className="text-gray-500">Modifiez vos critères de recherche</p>
            {(searchTerm || categoryFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
                className="mt-4 px-6 py-2 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9]"
              >
                <i className="fas fa-times mr-2"></i>Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
