'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'

type Player = {
  id: string
  first_name: string
  last_name: string
  smartping_licence: string
  fftt_points: string | null
  fftt_points_exact: number | null
  fftt_category: string | null
  category: string | null
  admin_notes: string | null
}

type SortType = 'default' | 'name-asc' | 'name-desc' | 'points-asc' | 'points-desc'

function parseClassement(points: string | null): { type: 'national' | 'points' | 'none'; value: number } {
  if (!points) return { type: 'none', value: 0 }
  const trimmed = points.trim()
  const nationalMatch = trimmed.match(/^N\s*(\d+)$/i)
  if (nationalMatch) {
    return { type: 'national', value: parseInt(nationalMatch[1]) }
  }
  const numericPoints = parseInt(trimmed.replace(/[^0-9]/g, '')) || 0
  return { type: 'points', value: numericPoints }
}

export default function JoueursPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [sortType, setSortType] = useState<SortType>('default')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchPlayers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .ilike('admin_notes', '%TLSTT%')

      if (error) {
        console.error('Erreur Supabase:', error)
      } else {
        setPlayers(data || [])
      }
      setLoading(false)
    }
    fetchPlayers()
  }, [])

  const sortedPlayers = useMemo(() => {
    let filtered = [...players]
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.first_name?.toLowerCase().includes(term) ||
        p.last_name?.toLowerCase().includes(term) ||
        p.smartping_licence?.toLowerCase().includes(term)
      )
    }

    // Tri
    filtered.sort((a, b) => {
      const classA = parseClassement(a.fftt_points)
      const classB = parseClassement(b.fftt_points)
      const pointsA = a.fftt_points_exact || classA.value
      const pointsB = b.fftt_points_exact || classB.value
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()

      switch (sortType) {
        case 'name-asc':
          return nameA.localeCompare(nameB, 'fr')
        case 'name-desc':
          return nameB.localeCompare(nameA, 'fr')
        case 'points-asc':
          if (classA.type === 'national' && classB.type !== 'national') return 1
          if (classA.type !== 'national' && classB.type === 'national') return -1
          return pointsA - pointsB
        case 'points-desc':
          if (classA.type === 'national' && classB.type !== 'national') return -1
          if (classA.type !== 'national' && classB.type === 'national') return 1
          if (classA.type === 'national' && classB.type === 'national') {
            return classA.value - classB.value
          }
          return pointsB - pointsA
        default: // 'default' - Nationaux d'abord puis points décroissants
          if (classA.type === 'national' && classB.type !== 'national') return -1
          if (classA.type !== 'national' && classB.type === 'national') return 1
          if (classA.type === 'national' && classB.type === 'national') {
            return classA.value - classB.value
          }
          return pointsB - pointsA
      }
    })

    return filtered
  }, [players, sortType, searchTerm])

  const nationalCount = players.filter(p => parseClassement(p.fftt_points).type === 'national').length
  const avgPoints = players.length > 0 
    ? Math.round(players.reduce((sum, p) => sum + (p.fftt_points_exact || parseClassement(p.fftt_points).value), 0) / players.length)
    : 0

  const sortButtons: { type: SortType; label: string; icon: string }[] = [
    { type: 'default', label: 'Classement', icon: 'fa-trophy' },
    { type: 'name-asc', label: 'A → Z', icon: 'fa-sort-alpha-down' },
    { type: 'name-desc', label: 'Z → A', icon: 'fa-sort-alpha-up' },
    { type: 'points-desc', label: 'Points ↓', icon: 'fa-sort-amount-down' },
    { type: 'points-asc', label: 'Points ↑', icon: 'fa-sort-amount-up' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark to-dark-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des joueurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark to-dark-light text-white">
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22%20fill%3D%22rgba%28249%2C115%2C22%2C0.1%29%22%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-white">🏓 NOS </span>
            <span className="bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">JOUEURS</span>
          </h1>
          <p className="text-xl text-gray-400">L'effectif complet du club TLSTT classé par niveau</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container-custom -mt-8 relative z-10 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-card border border-accent-orange/20 rounded-2xl p-6 text-center hover:border-accent-orange/50 hover:-translate-y-1 transition-all">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">{players.length}</div>
            <div className="text-gray-400 text-sm">Joueurs Licenciés</div>
          </div>
          <div className="bg-dark-card border border-accent-orange/20 rounded-2xl p-6 text-center hover:border-accent-orange/50 hover:-translate-y-1 transition-all">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">{nationalCount}</div>
            <div className="text-gray-400 text-sm">Classés Nationaux</div>
          </div>
          <div className="bg-dark-card border border-accent-orange/20 rounded-2xl p-6 text-center hover:border-accent-orange/50 hover:-translate-y-1 transition-all">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">{avgPoints}</div>
            <div className="text-gray-400 text-sm">Points Moyens</div>
          </div>
          <div className="bg-dark-card border border-accent-orange/20 rounded-2xl p-6 text-center hover:border-accent-orange/50 hover:-translate-y-1 transition-all">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-4xl font-bold text-green-500"><i className="fas fa-check"></i></div>
            <div className="text-gray-400 text-sm">Sync FFTT</div>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12">
        {/* Filtres */}
        <div className="bg-dark-card border border-accent-orange/15 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2"><i className="fas fa-search mr-2"></i>Rechercher</label>
              <input
                type="text"
                placeholder="Nom, prénom ou licence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark border border-accent-orange/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-accent-orange focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-400 mr-2 self-center">Trier par :</span>
            {sortButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => setSortType(btn.type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  sortType === btn.type
                    ? 'bg-gradient-to-r from-accent-orange to-accent-red text-white'
                    : 'bg-dark border border-accent-orange/30 text-gray-300 hover:border-accent-orange'
                }`}
              >
                <i className={`fas ${btn.icon} mr-2`}></i>{btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {sortedPlayers.length >= 3 && sortType === 'default' && !searchTerm && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-6">🏅 <span className="text-accent-orange">TOP 3</span> DU CLUB</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 0, 2].map((idx, order) => {
                const player = sortedPlayers[idx]
                if (!player) return null
                const classement = parseClassement(player.fftt_points)
                const isNational = classement.type === 'national'
                const medals = ['🥈', '🥇', '🥉']
                const borderColors = ['border-gray-400', 'border-yellow-400', 'border-amber-600']
                const bgColors = ['from-gray-500/10', 'from-yellow-500/15', 'from-amber-600/10']
                return (
                  <div
                    key={player.id}
                    className={`bg-gradient-to-b ${bgColors[order]} to-dark-card border-2 ${borderColors[order]} rounded-2xl p-6 text-center ${order === 1 ? 'md:-mt-4' : ''}`}
                  >
                    <div className="text-5xl mb-4">{medals[order]}</div>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-accent-orange to-accent-red flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {player.first_name[0]}{player.last_name[0]}
                    </div>
                    <h4 className="text-xl font-bold mb-2">{player.first_name} {player.last_name}</h4>
                    {isNational && (
                      <div className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold mb-2">
                        🇫🇷 N{classement.value}
                      </div>
                    )}
                    <div className="text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">
                      {player.fftt_points_exact || player.fftt_points} pts
                    </div>
                    <Link
                      href={`/joueurs/${player.smartping_licence}`}
                      className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-accent-orange to-accent-red text-white rounded-full font-semibold hover:scale-105 transition-transform"
                    >
                      Voir profil
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste des joueurs */}
        <h4 className="text-xl font-bold mb-4">
          <i className="fas fa-list mr-2"></i>Tous les joueurs 
          <span className="text-gray-400">({sortedPlayers.length})</span>
        </h4>

        {sortedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map((player, index) => {
              const classement = parseClassement(player.fftt_points)
              const isNational = classement.type === 'national'
              return (
                <Link
                  key={player.id}
                  href={`/joueurs/${player.smartping_licence}`}
                  className={`bg-dark-card border rounded-2xl p-5 hover:-translate-y-1 hover:border-accent-orange transition-all group relative ${
                    isNational ? 'border-yellow-500/50' : 'border-accent-orange/15'
                  }`}
                >
                  {isNational && (
                    <div className="absolute -top-3 right-4 text-2xl">🏆</div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded text-xs text-gray-400">
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent-orange to-accent-red flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {player.first_name[0]}{player.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-accent-orange transition-colors">
                        {player.first_name} {player.last_name}
                      </h3>
                      <div className="text-gray-400 text-sm">
                        <i className="fas fa-id-card mr-1"></i>{player.smartping_licence}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      {isNational && (
                        <div className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2 py-1 rounded-full text-xs font-bold mb-1">
                          🇫🇷 N{classement.value}
                        </div>
                      )}
                      <div className="text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">
                        {player.fftt_points_exact || player.fftt_points}
                      </div>
                      <div className="text-gray-500 text-xs">points</div>
                    </div>
                    {player.fftt_category && (
                      <span className="bg-accent-orange/20 text-accent-orange px-3 py-1 rounded-full text-xs border border-accent-orange/30">
                        {player.fftt_category}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-dark-card border border-accent-orange/15 rounded-2xl p-12 text-center">
            <i className="fas fa-search text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-400">Aucun joueur trouvé</h3>
            <p className="text-gray-500">Modifiez vos critères de recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}
