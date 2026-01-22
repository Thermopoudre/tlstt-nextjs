'use client'

import { useEffect, useState } from 'react'
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
  nouveauxPaliers: PlayerProgression[]
}

export default function ProgressionsPage() {
  const [topMois, setTopMois] = useState<PlayerProgression[]>([])
  const [topSaison, setTopSaison] = useState<PlayerProgression[]>([])
  const [tous, setTous] = useState<PlayerProgression[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategorie, setFilterCategorie] = useState<string>('')
  const [filterPeriode, setFilterPeriode] = useState<'mois' | 'saison'>('mois')
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [source, setSource] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/progressions', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        setTopMois(data.topMois || [])
        setTopSaison(data.topSaison || [])
        setTous(data.tous || [])
        setStats(data.stats || null)
        setLastUpdate(data.lastUpdate || '')
        setSource(data.source || '')
      } catch (err: any) {
        console.error('Erreur:', err)
        setError(err.message || 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrer les joueurs par points (tri décroissant)
  const sortedByPoints = [...tous].sort((a, b) => b.pointsActuels - a.pointsActuels)

  // Filtrer les joueurs
  const filteredPlayers = sortedByPoints
    .filter(p => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return p.nom.toLowerCase().includes(query) || 
               p.prenom.toLowerCase().includes(query) ||
               p.licence.includes(query)
      }
      return true
    })
    .filter(p => {
      if (!filterCategorie) return true
      if (filterCategorie === 'seniors') return p.categorie?.includes('S') || !p.categorie?.match(/^[JVB]/)
      if (filterCategorie === 'jeunes') return p.categorie?.match(/^[JBM]/)
      if (filterCategorie === 'veterans') return p.categorie?.match(/^V/)
      return true
    })
    .slice(0, searchQuery ? 50 : 20)

  // Top 3 pour les podiums (par points actuels)
  const podiumMois = sortedByPoints.slice(0, 3)
  const podiumSaison = sortedByPoints.slice(0, 3)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-6xl text-[#5bc0de] mb-4"></i>
          <p className="text-white/60">Chargement des joueurs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
          <p className="text-white/60">Erreur: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#5bc0de] text-white rounded-lg">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-[#5bc0de]/20 px-4 py-2 rounded-full text-[#5bc0de] text-sm font-semibold mb-4">
            <i className="fas fa-users"></i>
            {source === 'FFTT Live' ? 'En direct de la FFTT' : 'Données du club'}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Classement des <span className="text-[#5bc0de]">Joueurs</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Découvrez les joueurs du club classés par niveau
          </p>
          {lastUpdate && (
            <p className="text-white/40 text-sm mt-4">
              <i className="fas fa-clock mr-1"></i>
              Dernière mise à jour : {new Date(lastUpdate).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      <div className="container-custom pb-12 -mt-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#5bc0de]/20 border border-[#5bc0de]/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-[#5bc0de]">{stats.total}</div>
              <div className="text-white/70 text-sm mt-1">
                <i className="fas fa-users mr-1"></i>Joueurs licenciés
              </div>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-green-400">
                {sortedByPoints.filter(p => p.pointsActuels >= 1000).length}
              </div>
              <div className="text-green-300/70 text-sm mt-1">
                <i className="fas fa-star mr-1"></i>1000+ pts
              </div>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-yellow-400">
                {sortedByPoints.filter(p => p.pointsActuels >= 1500).length}
              </div>
              <div className="text-yellow-300/70 text-sm mt-1">
                <i className="fas fa-trophy mr-1"></i>1500+ pts
              </div>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-400">
                {sortedByPoints[0]?.pointsActuels || 0}
              </div>
              <div className="text-purple-300/70 text-sm mt-1">
                <i className="fas fa-medal mr-1"></i>Meilleur classement
              </div>
            </div>
          </div>
        )}

        {/* Podiums Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            <i className="fas fa-trophy mr-2 text-[#5bc0de]"></i>
            Top 3 du Club
          </h2>
          <div className="flex items-end justify-center gap-4 h-64">
            {/* 2e place */}
            {podiumMois[1] && (
              <div className="flex flex-col items-center">
                <Link href={`/joueurs/${podiumMois[1].licence}`} className="group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-[#0f3057] text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">
                    {podiumMois[1].prenom[0]}{podiumMois[1].nom[0]}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm">{podiumMois[1].prenom}</div>
                    <div className="text-white/60 text-xs">{podiumMois[1].nom}</div>
                    <div className="text-[#5bc0de] font-bold text-lg">{podiumMois[1].pointsActuels} pts</div>
                  </div>
                </Link>
                <div className="w-24 h-32 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-[#0f3057] text-3xl font-bold">2</span>
                </div>
              </div>
            )}
            {/* 1er place */}
            {podiumMois[0] && (
              <div className="flex flex-col items-center -mt-8">
                <div className="relative">
                  <i className="fas fa-crown text-yellow-400 text-2xl absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce"></i>
                  <Link href={`/joueurs/${podiumMois[0].licence}`} className="group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-[#0f3057] text-3xl font-bold mb-2 group-hover:scale-110 transition-transform ring-4 ring-yellow-400/50">
                      {podiumMois[0].prenom[0]}{podiumMois[0].nom[0]}
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{podiumMois[0].prenom}</div>
                      <div className="text-white/60 text-sm">{podiumMois[0].nom}</div>
                      <div className="text-[#5bc0de] font-bold text-xl">{podiumMois[0].pointsActuels} pts</div>
                    </div>
                  </Link>
                </div>
                <div className="w-28 h-44 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-[#0f3057] text-4xl font-bold">1</span>
                </div>
              </div>
            )}
            {/* 3e place */}
            {podiumMois[2] && (
              <div className="flex flex-col items-center">
                <Link href={`/joueurs/${podiumMois[2].licence}`} className="group">
                  <div className="w-18 h-18 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{width: '4.5rem', height: '4.5rem'}}>
                    {podiumMois[2].prenom[0]}{podiumMois[2].nom[0]}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm">{podiumMois[2].prenom}</div>
                    <div className="text-white/60 text-xs">{podiumMois[2].nom}</div>
                    <div className="text-[#5bc0de] font-bold">{podiumMois[2].pointsActuels} pts</div>
                  </div>
                </Link>
                <div className="w-20 h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Recherche */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input
                  type="text"
                  placeholder="Rechercher un joueur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre catégorie */}
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              className="bg-white/10 border border-white/20 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#5bc0de]"
            >
              <option value="">Toutes catégories</option>
              <option value="seniors">Seniors</option>
              <option value="jeunes">Jeunes</option>
              <option value="veterans">Vétérans</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">
              <i className="fas fa-list-ol mr-2 text-[#5bc0de]"></i>
              Classement par Points
              <span className="text-white/40 text-sm font-normal ml-2">
                ({searchQuery ? `${filteredPlayers.length} résultats` : 'Top 20'})
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Rang</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Joueur</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Points</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Catégorie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPlayers.map((player, index) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-[#0f3057]' :
                        index === 1 ? 'bg-gray-300 text-[#0f3057]' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/joueurs/${player.licence}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-[#5bc0de] flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                          {player.prenom[0]}{player.nom[0]}
                        </div>
                        <div>
                          <div className="text-white font-medium group-hover:text-[#5bc0de] transition-colors">
                            {player.prenom} {player.nom}
                          </div>
                          <div className="text-white/40 text-xs">{player.licence}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[#5bc0de] font-semibold">{player.pointsActuels}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white/60 text-sm">{player.categorie || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!searchQuery && (
            <div className="p-4 text-center border-t border-white/10">
              <p className="text-white/40 text-sm">
                <i className="fas fa-info-circle mr-1"></i>
                Utilisez la recherche pour trouver un joueur spécifique
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
