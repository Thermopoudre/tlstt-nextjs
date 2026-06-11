'use client'

import { useEffect, useMemo, useState } from 'react'
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

type Periode = 'mois' | 'saison'

export default function ProgressionsClient() {
  const [tous, setTous] = useState<PlayerProgression[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [search, setSearch] = useState('')
  const [periode, setPeriode] = useState<Periode>('mois')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/progressions', { cache: 'no-store' })
        const data = await response.json()
        const all: PlayerProgression[] = data.tous && data.tous.length
          ? data.tous
          : ([...(data.topMois || []), ...(data.topSaison || [])])
        const seen = new Set<string>()
        const uniq = all.filter(p => {
          const k = p.licence || p.id
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        setTous(uniq)
        setStats(data.stats || null)
        setSource(data.source || '')
        setLastUpdate(data.lastUpdate || '')
      } catch {
        // silencieux : la page reste utilisable meme si l'API echoue
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const evo = (p: PlayerProgression) => (periode === 'mois' ? p.progressionMois : p.progressionSaison)
  const evoAutre = (p: PlayerProgression) => (periode === 'mois' ? p.progressionSaison : p.progressionMois)

  const classement = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? tous.filter(p =>
          p.nom?.toLowerCase().includes(q) ||
          p.prenom?.toLowerCase().includes(q) ||
          p.licence?.includes(q))
      : tous
    return [...base].sort((a, b) => (periode === 'mois'
      ? b.progressionMois - a.progressionMois
      : b.progressionSaison - a.progressionSaison))
  }, [tous, search, periode])

  const podium = useMemo(
    () => (search.trim() ? [] : classement.filter(p => (periode === 'mois' ? p.progressionMois : p.progressionSaison) > 0).slice(0, 3)),
    [classement, search, periode]
  )

  const liste = search.trim() ? classement : classement.slice(0, 30)
  const totalPositifs = classement.filter(p => evo(p) > 0).length
  const periodeLabel = periode === 'mois' ? 'ce mois' : 'cette saison'
  const refLabel = periode === 'mois' ? 'du mois dernier' : 'du debut de saison (500 pts au depart)'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
              <i className="fas fa-chart-line mr-3 text-[#3b9fd8]"></i>
              <span className="text-[#3b9fd8]">PROGRESSIONS</span> DU CLUB
            </h1>
            <p className="text-xl text-gray-400">Les joueurs qui progressent le plus &mdash; du mois et de la saison</p>
            {(source || lastUpdate) && (
              <div className="flex justify-center mt-4">
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-[#1a1a1a] border border-[#333] text-gray-400">
                  <i className="fas fa-database mr-2 text-[#3b9fd8]"></i>
                  {source || 'Donnees du club'}{lastUpdate ? ` — ${lastUpdate}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{stats?.total ?? tous.length}</p>
              <p className="text-sm text-gray-500 mt-1">Joueurs</p>
            </div>
            <div className="bg-[#1a1a1a] border border-green-500/30 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-green-400">{stats?.enProgression ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">En progression</p>
            </div>
            <div className="bg-[#1a1a1a] border border-red-500/30 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-red-400">{stats?.enRegression ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">En baisse</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-gray-400">{stats?.stables ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Stables</p>
            </div>
          </div>
        )}

        <div className="flex justify-center flex-wrap gap-3 mb-6">
          <button
            onClick={() => setPeriode('mois')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              periode === 'mois'
                ? 'bg-[#3b9fd8] text-white shadow-lg'
                : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#3b9fd8]'
            }`}
          >
            <i className="fas fa-fire mr-2"></i>Evolutions du mois
          </button>
          <button
            onClick={() => setPeriode('saison')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              periode === 'saison'
                ? 'bg-[#3b9fd8] text-white shadow-lg'
                : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#3b9fd8]'
            }`}
          >
            <i className="fas fa-calendar-check mr-2"></i>Evolutions de la saison
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mb-6">
          Calcul : points actuels &minus; points {refLabel}.
        </p>

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

        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : (
          <>
            {podium.length >= 1 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-center mb-8 text-white">
                  <i className="fas fa-trophy mr-2 text-yellow-400"></i>
                  <span className="text-[#3b9fd8]">TOP 3</span> &mdash; meilleures evolutions {periodeLabel}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {[1, 0, 2].map((idx, order) => {
                    const player = podium[idx]
                    if (!player) return null
                    const medals = ['🥈', '🥇', '🥉']
                    const positions = ['2e', '1er', '3e']
                    const borderColors = ['border-gray-400', 'border-yellow-500', 'border-amber-700']
                    const bgColors = ['bg-gray-500/10', 'bg-yellow-500/10', 'bg-amber-700/10']
                    return (
                      <div
                        key={player.id}
                        className={`${bgColors[order]} border-2 ${borderColors[order]} rounded-2xl p-6 text-center ${order === 1 ? 'md:-mt-6 md:scale-105' : ''}`}
                      >
                        <div className="text-5xl mb-3">{medals[order]}</div>
                        <div className="text-lg font-bold text-white mb-2">{positions[order]}</div>
                        <div className="w-16 h-16 rounded-full bg-[#3b9fd8] flex items-center justify-center text-xl font-bold text-white mx-auto mb-4">
                          {player.prenom?.[0]}{player.nom?.[0]}
                        </div>
                        <h4 className="text-lg font-bold mb-1 text-white">{player.prenom} {player.nom}</h4>
                        <p className="text-gray-500 text-sm mb-3">{player.licence}</p>
                        <div className="text-2xl font-bold text-white">
                          {Math.round(player.pointsActuels)} <span className="text-sm text-gray-500">pts</span>
                        </div>
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-400">
                          <i className="fas fa-arrow-up mr-1"></i>+{Math.round(evo(player))} {periodeLabel}
                        </div>
                        <div>
                          <Link
                            href={`/joueurs/${player.licence}`}
                            className="inline-block mt-4 px-5 py-2 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-all text-sm"
                          >
                            <i className="fas fa-user mr-2"></i>Profil
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#333] flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <i className={`fas ${periode === 'mois' ? 'fa-fire text-orange-500' : 'fa-calendar-check text-[#3b9fd8]'}`}></i>
                  Meilleures evolutions {periodeLabel}
                </h2>
                <span className="text-sm text-gray-500">
                  {search.trim() ? `${liste.length} resultat(s)` : `${totalPositifs} en progression`}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#111] border-b border-[#333]">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400 w-16">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Joueur</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Points</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">{periode === 'mois' ? 'Ce mois' : 'Cette saison'}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400 hidden md:table-cell">{periode === 'mois' ? 'Saison' : 'Ce mois'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {liste.map((player, index) => {
                      const e = Math.round(evo(player))
                      const eAutre = Math.round(evoAutre(player))
                      return (
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
                            <span className="font-bold text-white">{Math.round(player.pointsActuels)}</span>
                            <span className="text-gray-500 text-sm ml-1">pts</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              e > 0 ? 'bg-green-500/20 text-green-400' :
                              e < 0 ? 'bg-red-500/20 text-red-400' : 'bg-[#333] text-gray-400'
                            }`}>
                              {e > 0 && <i className="fas fa-arrow-up mr-1"></i>}
                              {e < 0 && <i className="fas fa-arrow-down mr-1"></i>}
                              {e > 0 ? '+' : ''}{e}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className={`text-sm font-semibold ${
                              eAutre > 0 ? 'text-green-400' : eAutre < 0 ? 'text-red-400' : 'text-gray-500'
                            }`}>
                              {eAutre > 0 ? '+' : ''}{eAutre}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {liste.length === 0 && (
                <div className="p-12 text-center">
                  <i className="fas fa-chart-line text-6xl text-gray-600 mb-4"></i>
                  <h3 className="text-xl font-bold text-white mb-2">Aucun resultat</h3>
                  <p className="text-gray-500">Essayez une autre recherche.</p>
                </div>
              )}
            </div>

            {stats?.nouveauxPaliers && stats.nouveauxPaliers.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-award text-purple-400 mr-2"></i>
                  Nouveaux paliers atteints
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
          </>
        )}
      </div>
    </div>
  )
}
