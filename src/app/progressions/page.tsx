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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategorie, setFilterCategorie] = useState<string>('')
  const [filterPeriode, setFilterPeriode] = useState<'mois' | 'saison'>('mois')
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/progressions')
        const data = await response.json()
        setTopMois(data.topMois || [])
        setTopSaison(data.topSaison || [])
        setTous(data.tous || [])
        setStats(data.stats || null)
        setLastUpdate(data.lastUpdate || '')
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrer les joueurs
  const filteredPlayers = tous
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
    .sort((a, b) => {
      if (filterPeriode === 'mois') return b.progressionMois - a.progressionMois
      return b.progressionSaison - a.progressionSaison
    })
    .slice(0, searchQuery ? 50 : 20)

  // Top 3 pour les podiums
  const podiumMois = topMois.slice(0, 3)
  const podiumSaison = topSaison.slice(0, 3)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-6xl text-[#5bc0de] mb-4"></i>
          <p className="text-white/60">Calcul des progressions en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-gradient-to-b from-[#0f3057] to-[#1a5a8a]">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-[#5bc0de]/20 px-4 py-2 rounded-full text-[#5bc0de] text-sm font-semibold mb-4">
            <i className="fas fa-fire"></i>
            Mis à jour en direct depuis la FFTT
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Les <span className="text-[#5bc0de]">Pépites</span> du Club
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Découvrez les joueurs qui font bouger le classement
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
        {/* Stats Fun Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-green-400">{stats.enProgression}</div>
              <div className="text-green-300/70 text-sm mt-1">
                <i className="fas fa-arrow-up mr-1"></i>En progression
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-red-400">{stats.enRegression}</div>
              <div className="text-red-300/70 text-sm mt-1">
                <i className="fas fa-arrow-down mr-1"></i>En régression
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-gray-400">{stats.stables}</div>
              <div className="text-gray-300/70 text-sm mt-1">
                <i className="fas fa-minus mr-1"></i>Stables
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#5bc0de]/20 to-[#5bc0de]/10 border border-[#5bc0de]/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-[#5bc0de]">{stats.total}</div>
              <div className="text-[#5bc0de]/70 text-sm mt-1">
                <i className="fas fa-users mr-1"></i>Joueurs analysés
              </div>
            </div>
          </div>
        )}

        {/* Podiums Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Podium du Mois */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              <i className="fas fa-calendar-alt mr-2 text-[#5bc0de]"></i>
              Top 3 du Mois
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
                      <div className="text-green-400 font-bold text-lg">+{podiumMois[1].progressionMois}</div>
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
                        <div className="text-green-400 font-bold text-xl">+{podiumMois[0].progressionMois}</div>
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
                      <div className="text-green-400 font-bold">+{podiumMois[2].progressionMois}</div>
                    </div>
                  </Link>
                  <div className="w-20 h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white text-2xl font-bold">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Podium de la Saison */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              <i className="fas fa-trophy mr-2 text-[#5bc0de]"></i>
              Top 3 de la Saison
            </h2>
            <div className="flex items-end justify-center gap-4 h-64">
              {/* 2e place */}
              {podiumSaison[1] && (
                <div className="flex flex-col items-center">
                  <Link href={`/joueurs/${podiumSaison[1].licence}`} className="group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-[#0f3057] text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">
                      {podiumSaison[1].prenom[0]}{podiumSaison[1].nom[0]}
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold text-sm">{podiumSaison[1].prenom}</div>
                      <div className="text-white/60 text-xs">{podiumSaison[1].nom}</div>
                      <div className="text-green-400 font-bold text-lg">+{podiumSaison[1].progressionSaison}</div>
                    </div>
                  </Link>
                  <div className="w-24 h-32 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-[#0f3057] text-3xl font-bold">2</span>
                  </div>
                </div>
              )}
              {/* 1er place */}
              {podiumSaison[0] && (
                <div className="flex flex-col items-center -mt-8">
                  <div className="relative">
                    <i className="fas fa-crown text-yellow-400 text-2xl absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce"></i>
                    <Link href={`/joueurs/${podiumSaison[0].licence}`} className="group">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-[#0f3057] text-3xl font-bold mb-2 group-hover:scale-110 transition-transform ring-4 ring-yellow-400/50">
                        {podiumSaison[0].prenom[0]}{podiumSaison[0].nom[0]}
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">{podiumSaison[0].prenom}</div>
                        <div className="text-white/60 text-sm">{podiumSaison[0].nom}</div>
                        <div className="text-green-400 font-bold text-xl">+{podiumSaison[0].progressionSaison}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="w-28 h-44 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-[#0f3057] text-4xl font-bold">1</span>
                  </div>
                </div>
              )}
              {/* 3e place */}
              {podiumSaison[2] && (
                <div className="flex flex-col items-center">
                  <Link href={`/joueurs/${podiumSaison[2].licence}`} className="group">
                    <div className="w-18 h-18 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{width: '4.5rem', height: '4.5rem'}}>
                      {podiumSaison[2].prenom[0]}{podiumSaison[2].nom[0]}
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold text-sm">{podiumSaison[2].prenom}</div>
                      <div className="text-white/60 text-xs">{podiumSaison[2].nom}</div>
                      <div className="text-green-400 font-bold">+{podiumSaison[2].progressionSaison}</div>
                    </div>
                  </Link>
                  <div className="w-20 h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white text-2xl font-bold">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Record du Club & Nouveaux Paliers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Record du Club */}
          {stats?.recordMois && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-fire-alt mr-2 text-orange-400"></i>
                Record du Mois
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl font-bold">
                  {stats.recordMois.prenom[0]}{stats.recordMois.nom[0]}
                </div>
                <div>
                  <div className="text-white font-semibold">{stats.recordMois.prenom} {stats.recordMois.nom}</div>
                  <div className="text-white/60 text-sm">{stats.recordMois.pointsActuels} pts</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-bold text-green-400">+{stats.recordMois.progressionMois}</div>
                  <div className="text-green-300/70 text-sm">points ce mois</div>
                </div>
              </div>
            </div>
          )}

          {/* Nouveaux Paliers */}
          {stats?.nouveauxPaliers && stats.nouveauxPaliers.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-star mr-2 text-yellow-400"></i>
                Nouveaux Paliers Atteints
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.nouveauxPaliers.slice(0, 5).map((p, i) => (
                  <Link 
                    key={i} 
                    href={`/joueurs/${p.licence}`}
                    className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <span className="text-white font-medium text-sm">{p.prenom} {p.nom[0]}.</span>
                    <span className="bg-yellow-500 text-[#0f3057] text-xs font-bold px-2 py-0.5 rounded-full">
                      {p.palierAtteint}+
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Distribution Chart */}
        {stats && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12">
            <h3 className="text-xl font-bold text-white mb-6">
              <i className="fas fa-chart-pie mr-2 text-[#5bc0de]"></i>
              Distribution des Progressions
            </h3>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* En progression */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#22c55e"
                    strokeWidth="20"
                    strokeDasharray={`${(stats.enProgression / stats.total) * 251.2} 251.2`}
                  />
                  {/* Stables */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#6b7280"
                    strokeWidth="20"
                    strokeDasharray={`${(stats.stables / stats.total) * 251.2} 251.2`}
                    strokeDashoffset={`${-(stats.enProgression / stats.total) * 251.2}`}
                  />
                  {/* En régression */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${(stats.enRegression / stats.total) * 251.2} 251.2`}
                    strokeDashoffset={`${-((stats.enProgression + stats.stables) / stats.total) * 251.2}`}
                  />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-white">En progression</span>
                  <span className="text-white/60 ml-auto">{Math.round((stats.enProgression / stats.total) * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-white">Stables</span>
                  <span className="text-white/60 ml-auto">{Math.round((stats.stables / stats.total) * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-white">En régression</span>
                  <span className="text-white/60 ml-auto">{Math.round((stats.enRegression / stats.total) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

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

            {/* Filtre période */}
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setFilterPeriode('mois')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterPeriode === 'mois' ? 'bg-[#5bc0de] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Ce mois
              </button>
              <button
                onClick={() => setFilterPeriode('saison')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterPeriode === 'saison' ? 'bg-[#5bc0de] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Cette saison
              </button>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">
              <i className="fas fa-list-ol mr-2 text-[#5bc0de]"></i>
              Classement des Progressions
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
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Points actuels</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">
                    {filterPeriode === 'mois' ? 'Progression Mois' : 'Progression Saison'}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPlayers.map((player, index) => {
                  const progression = filterPeriode === 'mois' ? player.progressionMois : player.progressionSaison
                  const isPositive = progression > 0
                  const isNegative = progression < 0
                  
                  return (
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
                        <span className={`font-bold ${
                          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white/40'
                        }`}>
                          {isPositive ? '+' : ''}{progression}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm ${
                          player.progressionPourcentage > 0 ? 'text-green-400' : 
                          player.progressionPourcentage < 0 ? 'text-red-400' : 'text-white/40'
                        }`}>
                          {player.progressionPourcentage > 0 ? '+' : ''}{player.progressionPourcentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
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
