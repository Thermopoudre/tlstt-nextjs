'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

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

function parseClassement(points: string | number | null): { type: 'national' | 'points' | 'none'; value: number } {
  if (points === null || points === undefined) return { type: 'none', value: 0 }
  
  // Convert to string if it's a number
  const pointsStr = String(points).trim()
  if (!pointsStr) return { type: 'none', value: 0 }
  
  const nationalMatch = pointsStr.match(/^N\s*(\d+)$/i)
  if (nationalMatch) {
    return { type: 'national', value: parseInt(nationalMatch[1]) }
  }
  const numericPoints = parseInt(pointsStr.replace(/[^0-9]/g, '')) || 0
  return { type: 'points', value: numericPoints }
}

export default function JoueursClient({ initialPlayers }: { initialPlayers: Player[] }) {
  const [sortType, setSortType] = useState<SortType>('default')
  const [searchTerm, setSearchTerm] = useState('')

  const sortedPlayers = useMemo(() => {
    let filtered = [...initialPlayers]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.first_name?.toLowerCase().includes(term) ||
        p.last_name?.toLowerCase().includes(term) ||
        p.smartping_licence?.toLowerCase().includes(term)
      )
    }

    filtered.sort((a, b) => {
      const classA = parseClassement(a.fftt_points)
      const classB = parseClassement(b.fftt_points)
      const pointsA = a.fftt_points_exact || classA.value
      const pointsB = b.fftt_points_exact || classB.value
      const nameA = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase()
      const nameB = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase()

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
        default:
          if (classA.type === 'national' && classB.type !== 'national') return -1
          if (classA.type !== 'national' && classB.type === 'national') return 1
          if (classA.type === 'national' && classB.type === 'national') {
            return classA.value - classB.value
          }
          return pointsB - pointsA
      }
    })

    return filtered
  }, [initialPlayers, sortType, searchTerm])

  const nationalCount = initialPlayers.filter(p => parseClassement(p.fftt_points).type === 'national').length
  const avgPoints = initialPlayers.length > 0 
    ? Math.round(initialPlayers.reduce((sum, p) => sum + (p.fftt_points_exact || parseClassement(p.fftt_points).value), 0) / initialPlayers.length)
    : 0

  const sortButtons: { type: SortType; label: string; icon: string }[] = [
    { type: 'default', label: 'Classement', icon: 'fa-trophy' },
    { type: 'name-asc', label: 'A - Z', icon: 'fa-sort-alpha-down' },
    { type: 'name-desc', label: 'Z - A', icon: 'fa-sort-alpha-up' },
    { type: 'points-desc', label: 'Points -', icon: 'fa-sort-amount-down' },
    { type: 'points-asc', label: 'Points +', icon: 'fa-sort-amount-up' },
  ]

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-16 bg-[#0f3057]">
        <div className="container-custom text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            <i className="fas fa-table-tennis mr-3 text-[#5bc0de]"></i>
            NOS <span className="text-[#5bc0de]">JOUEURS</span>
          </h1>
          <p className="text-xl text-white/80">L'effectif complet du club TLSTT classe par niveau</p>
        </div>
      </div>

      {/* Stats */}
      <div className="container-custom -mt-4 relative z-10 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
            <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-users text-2xl text-white"></i>
            </div>
            <div className="text-4xl font-bold text-white">{initialPlayers.length}</div>
            <div className="text-[#5bc0de] text-sm">Joueurs Licencies</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
            <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-trophy text-2xl text-white"></i>
            </div>
            <div className="text-4xl font-bold text-white">{nationalCount}</div>
            <div className="text-[#5bc0de] text-sm">Classes Nationaux</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
            <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-star text-2xl text-white"></i>
            </div>
            <div className="text-4xl font-bold text-white">{avgPoints}</div>
            <div className="text-[#5bc0de] text-sm">Points Moyens</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
            <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-sync text-2xl text-white"></i>
            </div>
            <div className="text-4xl font-bold text-green-400"><i className="fas fa-check"></i></div>
            <div className="text-[#5bc0de] text-sm">Sync FFTT</div>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12">
        {/* Filtres */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-white"><i className="fas fa-search mr-2"></i>Rechercher</label>
              <input
                type="text"
                placeholder="Nom, prenom ou licence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-[#5bc0de] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-white/80 mr-2 self-center">Trier par :</span>
            {sortButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => setSortType(btn.type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  sortType === btn.type
                    ? 'bg-[#5bc0de] text-white'
                    : 'bg-white/10 border border-white/30 text-white hover:bg-white/20'
                }`}
              >
                <i className={`fas ${btn.icon} mr-2`}></i>{btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 */}
        {sortedPlayers.length >= 3 && sortType === 'default' && !searchTerm && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-6 text-white">
              <i className="fas fa-medal mr-2 text-[#5bc0de]"></i>
              <span className="text-[#5bc0de]">TOP 3</span> DU CLUB
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 0, 2].map((idx, order) => {
                const player = sortedPlayers[idx]
                if (!player) return null
                const classement = parseClassement(player.fftt_points)
                const isNational = classement.type === 'national'
                const medals = ['2e', '1er', '3e']
                const borderColors = ['border-gray-300', 'border-[#5bc0de]', 'border-amber-600']
                return (
                  <div
                    key={player.id}
                    className={`bg-white/10 border-2 ${borderColors[order]} rounded-2xl p-6 text-center ${order === 1 ? 'md:-mt-4' : ''}`}
                  >
                    <div className="text-3xl mb-4 font-bold text-[#5bc0de]">{medals[order]}</div>
                    <div className="w-20 h-20 rounded-full bg-[#5bc0de] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                    <h4 className="text-xl font-bold mb-2 text-white">{player.first_name} {player.last_name}</h4>
                    {isNational && (
                      <div className="inline-block bg-[#5bc0de] text-white px-3 py-1 rounded-full text-sm font-bold mb-2">
                        N{classement.value}
                      </div>
                    )}
                    <div className="text-2xl font-bold text-[#5bc0de]">
                      {player.fftt_points_exact || player.fftt_points} pts
                    </div>
                    <Link
                      href={`/joueurs/${player.smartping_licence}`}
                      className="inline-block mt-4 px-6 py-2 bg-[#5bc0de] text-white rounded-full font-semibold hover:bg-[#4ab0ce] transition-all"
                    >
                      Voir profil
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste */}
        <h4 className="text-xl font-bold mb-4 text-white">
          <i className="fas fa-list mr-2"></i>Tous les joueurs 
          <span className="text-white/60">({sortedPlayers.length})</span>
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
                  className={`bg-white/10 border rounded-2xl p-5 hover:-translate-y-1 hover:bg-white/15 transition-all group relative ${
                    isNational ? 'border-[#5bc0de]/50' : 'border-white/20'
                  }`}
                >
                  {isNational && (
                    <div className="absolute -top-3 right-4">
                      <i className="fas fa-trophy text-2xl text-[#5bc0de]"></i>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/30 px-2 py-1 rounded text-xs text-white/60">
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#5bc0de] flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white group-hover:text-[#5bc0de] transition-colors">
                        {player.first_name} {player.last_name}
                      </h3>
                      <div className="text-white/60 text-sm">
                        <i className="fas fa-id-card mr-1"></i>{player.smartping_licence}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      {isNational && (
                        <div className="inline-block bg-[#5bc0de] text-white px-2 py-1 rounded-full text-xs font-bold mb-1">
                          N{classement.value}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-[#5bc0de]">
                        {player.fftt_points_exact || player.fftt_points}
                      </div>
                      <div className="text-white/60 text-xs">points</div>
                    </div>
                    {player.fftt_category && (
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs border border-white/30">
                        {player.fftt_category}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <i className="fas fa-search text-6xl text-white/30 mb-4"></i>
            <h3 className="text-2xl font-bold text-white/80">Aucun joueur trouve</h3>
            <p className="text-white/60">Modifiez vos criteres de recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}
