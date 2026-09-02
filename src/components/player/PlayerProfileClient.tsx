'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Player {
  id: string
  first_name: string
  last_name: string
  smartping_licence: string
  fftt_points: number
  fftt_points_exact: number | null
  fftt_points_ancien?: number | null
  fftt_points_initial?: number | null
  category: string | null
  last_sync: string | null
  // Données enrichies depuis API
  pointsMensuels?: number
  anciensPointsMensuels?: number
  pointsInitiaux?: number
  progressionAnnuelle?: number
  progressionMensuelle?: number
  rangDepartemental?: string
  rangRegional?: string
  rangNational?: string
  classementGlobal?: string
  nationalite?: string
  categorie?: string
  echelon?: string
  place?: string
  propositionClassement?: string
  valeurInitiale?: number
  classementOfficiel?: string
}

interface Partie {
  date: string
  dateFormatted: string
  adversaire: string
  adversaireClassement: string | null
  victoire: boolean
  pointsResultat: number
  coefficient: number
  journee: string | null
}

interface Historique {
  saison: string
  phase: string
  points: number
  echelon?: string | null
  place?: string | null
}

interface Stats {
  total: number
  victoires: number
  defaites: number
  pourcentage: number
  pointsGagnes: number
  pointsPerdus: number
  bilan: number
}

interface PlayerProfileProps {
  initialPlayer: Player
  initialHistory?: any[]
}

export default function PlayerProfileClient({ initialPlayer, initialHistory }: PlayerProfileProps) {
  const [player, setPlayer] = useState<Player>(initialPlayer)
  const [parties, setParties] = useState<Partie[]>([])
  const [historique, setHistorique] = useState<Historique[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [source, setSource] = useState<'cache' | 'api'>('cache')
  const [showAllParties, setShowAllParties] = useState(false)

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/player/${player.smartping_licence}`)
      const data = await response.json()

      if (data.player) {
        // Si l'API live FFTT ne renvoie pas de points exploitables (endpoint non active),
        // on conserve les points stockes (Supabase, sync cron) et on neutralise les deltas aberrants.
        const live = data.player
        const liveHasPoints = Number(live.pointsMensuels) > 0 || Number(live.fftt_points_exact) > 0
        if (liveHasPoints) {
          setPlayer(live)
        } else {
          setPlayer((prev) => ({
            ...live,
            fftt_points: prev.fftt_points,
            fftt_points_exact: prev.fftt_points_exact,
            fftt_points_ancien: prev.fftt_points_ancien,
            fftt_points_initial: prev.fftt_points_initial,
            pointsMensuels: prev.pointsMensuels || prev.fftt_points_exact || prev.fftt_points,
            anciensPointsMensuels: prev.anciensPointsMensuels,
            pointsInitiaux: prev.pointsInitiaux,
            progressionMensuelle: prev.progressionMensuelle ?? 0,
            progressionAnnuelle: prev.progressionAnnuelle ?? 0,
            rangDepartemental: prev.rangDepartemental,
            rangRegional: prev.rangRegional,
            rangNational: prev.rangNational,
            classementOfficiel: prev.classementOfficiel,
          }))
        }
      }
      if (data.parties) setParties(data.parties)
      if (data.historique) setHistorique(data.historique)
      if (data.stats) setStats(data.stats)
      setSource(data.source || 'api')
      setLastRefresh(new Date().toLocaleTimeString('fr-FR'))
    } catch (error) {
      console.error('Erreur refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [player.smartping_licence])

  // Rafraîchissement automatique UNE seule fois à l'ouverture de la fiche.
  // Avant, l'effet dépendait de player.last_sync : chaque réponse de l'API
  // remplaçait « player » (sans last_sync à jour), ce qui relançait l'effet…
  // et la fiche appelait l'API FFTT en boucle sans fin.
  const rafraichissementAutoFait = useRef(false)
  useEffect(() => {
    if (rafraichissementAutoFait.current) return
    rafraichissementAutoFait.current = true
    const lastSync = player.last_sync ? new Date(player.last_sync) : null
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (!lastSync || lastSync < oneHourAgo) {
      refreshData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isNational = player.category?.match(/^N(\d+)$/i)
  const nationalRank = isNational ? parseInt(isNational[1]) : null
  const displayPoints = Math.round(player.pointsMensuels || player.fftt_points_exact || player.fftt_points || 0)
  const partiesToShow = showAllParties ? parties : parties.slice(0, 20)
  const smartpingFailed = source === 'cache' && lastRefresh !== null

  // L'historique officiel (xml_histo_classement) est refusé par la FFTT pour ce
  // compte (401). On reconstitue donc l'évolution de la saison à partir des
  // parties : points de début de saison + cumul des gains/pertes, mois par mois.
  const courbeSaison = (() => {
    if (historique.length > 1 || parties.length === 0) return [] as { libelle: string; points: number; date: string }[]
    const depart = Number(player.pointsInitiaux || player.valeurInitiale || player.fftt_points_initial || 0)
    if (!depart) return []
    const parDate = [...parties]
      .map(p => ({ ...p, d: new Date(p.date.includes('/') ? p.date.split('/').reverse().join('-') : p.date) }))
      .filter(p => !isNaN(p.d.getTime()))
      .sort((a, b) => a.d.getTime() - b.d.getTime())
    if (parDate.length === 0) return []
    const points: { libelle: string; points: number; date: string }[] = []
    let cumul = depart
    let moisCourant = ''
    const premier = parDate[0].d
    points.push({ libelle: 'Début', points: Math.round(depart), date: premier.toISOString() })
    for (const p of parDate) {
      cumul += Number(p.pointsResultat) || 0
      const cle = `${p.d.getFullYear()}-${p.d.getMonth()}`
      const libelle = p.d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (cle === moisCourant) {
        points[points.length - 1] = { libelle, points: Math.round(cumul * 10) / 10, date: p.d.toISOString() }
      } else {
        moisCourant = cle
        points.push({ libelle, points: Math.round(cumul * 10) / 10, date: p.d.toISOString() })
      }
    }
    return points
  })()

  const historiqueReversed = [...historique].reverse()
  const minPoints = historique.length > 0 ? Math.min(...historique.map(h => h.points)) - 50 : 500
  const maxPoints = historique.length > 0 ? Math.max(...historique.map(h => h.points)) + 50 : 2000

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#3b9fd8] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>

            {/* Infos */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {player.first_name} <span className="text-[#3b9fd8]">{player.last_name}</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-gray-400">
                <span className="flex items-center gap-2">
                  <i className="fas fa-id-card text-[#3b9fd8]"></i>
                  Licence: {player.smartping_licence}
                </span>
                {nationalRank && (
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    <i className="fas fa-flag mr-1"></i> N{nationalRank} France
                  </span>
                )}
                {player.categorie && (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-user-tag text-[#3b9fd8]"></i>
                    {player.categorie}
                  </span>
                )}
              </div>

              {lastRefresh && (
                <div className="mt-3 text-gray-600 text-sm">
                  <i className={`fas ${source === 'api' ? 'fa-check-circle text-green-500' : 'fa-database text-yellow-500'} mr-1`}></i>
                  {source === 'api' ? 'Données FFTT' : 'Données cache'} — {lastRefresh}
                </div>
              )}
            </div>

            {/* Bouton actualiser */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-5 py-2 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
            >
              <i className={`fas fa-sync ${isRefreshing ? 'animate-spin' : ''}`}></i>
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-[#3b9fd8]">{displayPoints}</div>
            <div className="text-gray-500 text-sm mt-1">Points mensuels</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center">
            <div className={`text-4xl font-bold ${(player.progressionMensuelle || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(player.progressionMensuelle || 0) > 0 ? '+' : ''}{player.progressionMensuelle || 0}
            </div>
            <div className="text-gray-500 text-sm mt-1">Ce mois</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center">
            <div className={`text-4xl font-bold ${(player.progressionAnnuelle || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(player.progressionAnnuelle || 0) > 0 ? '+' : ''}{player.progressionAnnuelle || 0}
            </div>
            <div className="text-gray-500 text-sm mt-1">Cette saison</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white">{stats?.total || 0}</div>
            <div className="text-gray-500 text-sm mt-1">Parties jouées</div>
          </div>
        </div>

        {/* Données détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Points détaillés */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-chart-line mr-2 text-[#3b9fd8]"></i>Détail des points
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Points mensuels actuels</span>
                <span className="text-[#3b9fd8] font-bold text-xl">{player.pointsMensuels || displayPoints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Anciens points mensuels</span>
                <span className="text-white font-semibold">{player.anciensPointsMensuels || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Points début saison</span>
                <span className="text-white font-semibold">{player.pointsInitiaux || player.valeurInitiale || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Classement officiel</span>
                <span className="text-white font-semibold">{player.classementOfficiel || '-'}</span>
              </div>
              {player.propositionClassement && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Proposition classement</span>
                  <span className="text-yellow-400 font-semibold">{player.propositionClassement}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rangs */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-medal mr-2 text-[#3b9fd8]"></i>Classements
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rang départemental</span>
                <span className="text-[#3b9fd8] font-bold text-xl">{player.rangDepartemental || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rang régional</span>
                <span className="text-[#3b9fd8] font-bold text-xl">{player.rangRegional || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rang national</span>
                <span className="text-[#3b9fd8] font-bold text-xl">{player.rangNational || player.classementGlobal || '-'}</span>
              </div>
              {player.echelon === 'N' && player.place && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Top France</span>
                  <span className="text-yellow-400 font-bold">N{player.place}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Victoires/Défaites */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-green-400">{stats.victoires}</div>
              <div className="text-green-500/70 text-sm mt-1">Victoires</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-red-400">{stats.defaites}</div>
              <div className="text-red-500/70 text-sm mt-1">Défaites</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-400">{stats.pourcentage}%</div>
              <div className="text-blue-500/70 text-sm mt-1">Taux victoire</div>
            </div>
            <div className={`${stats.bilan >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-2xl p-6 text-center`}>
              <div className={`text-4xl font-bold ${stats.bilan >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.bilan > 0 ? '+' : ''}{stats.bilan}
              </div>
              <div className="text-gray-500 text-sm mt-1">Bilan pts</div>
            </div>
          </div>
        )}

        {/* Graphique d'évolution */}
        {courbeSaison.length > 1 && (() => {
          const vals = courbeSaison.map(c => c.points)
          const mn = Math.floor(Math.min(...vals) / 10) * 10 - 10
          const mx = Math.ceil(Math.max(...vals) / 10) * 10 + 10
          const W = 600, H = 200, PAD = 8
          const x = (i: number) => PAD + (i * (W - 2 * PAD)) / Math.max(1, courbeSaison.length - 1)
          const y = (v: number) => H - PAD - ((v - mn) / (mx - mn || 1)) * (H - 2 * PAD)
          const chemin = courbeSaison.map((c, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(c.points).toFixed(1)}`).join(' ')
          const aire = `${chemin} L ${x(courbeSaison.length - 1).toFixed(1)} ${H - PAD} L ${x(0).toFixed(1)} ${H - PAD} Z`
          const dernier = courbeSaison[courbeSaison.length - 1]
          const delta = Math.round((dernier.points - courbeSaison[0].points) * 10) / 10
          return (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 sm:p-6 mb-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 className="text-xl font-bold text-white">
                  <i className="fas fa-chart-line mr-2 text-[#3b9fd8]"></i>Progression sur la saison
                </h2>
                <span className={`text-sm font-semibold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {delta >= 0 ? '+' : ''}{delta} pts depuis le début de saison
                </span>
              </div>
              <div className="relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 sm:h-56" role="img" aria-label={`Évolution des points sur la saison : ${courbeSaison.map(c => `${c.libelle} ${c.points}`).join(', ')}`}>
                  <defs>
                    <linearGradient id="aireProgression" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b9fd8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b9fd8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map(t => (
                    <line key={t} x1={PAD} x2={W - PAD} y1={PAD + t * (H - 2 * PAD)} y2={PAD + t * (H - 2 * PAD)} stroke="#2a2a2a" strokeDasharray="4 4" />
                  ))}
                  <path d={aire} fill="url(#aireProgression)" />
                  <path d={chemin} fill="none" stroke="#3b9fd8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                  {courbeSaison.map((c, i) => (
                    <g key={i}>
                      <circle cx={x(i)} cy={y(c.points)} r="4.5" fill="#0a0a0a" stroke="#3b9fd8" strokeWidth="2.5">
                        <title>{`${c.libelle} : ${c.points} pts`}</title>
                      </circle>
                    </g>
                  ))}
                </svg>
                <div className="flex justify-between text-[11px] sm:text-xs text-gray-500 mt-1 px-1">
                  {courbeSaison.map((c, i) => (
                    <span key={i} className={courbeSaison.length > 8 && i % 2 === 1 ? 'hidden sm:inline' : ''}>{c.libelle}</span>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Min {Math.min(...vals)} pts</span>
                  <span>Max {Math.max(...vals)} pts</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Courbe calculée à partir des {parties.length} parties de la saison (points de début de saison + gains et pertes).
              </p>
            </div>
          )
        })()}

        {historique.length > 1 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-chart-area mr-2 text-[#3b9fd8]"></i>Évolution du classement
            </h2>
            <div className="relative h-64 bg-[#111] rounded-xl p-4">
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-gray-600 text-xs">
                <span>{maxPoints}</span>
                <span>{Math.round((maxPoints + minPoints) / 2)}</span>
                <span>{minPoints}</span>
              </div>
              <div className="ml-14 h-full flex items-end gap-1">
                {historiqueReversed.map((h, i) => {
                  const height = ((h.points - minPoints) / (maxPoints - minPoints)) * 100
                  return (
                    <div key={i} className="flex-1 group relative" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#3b9fd8] rounded-t transition-all hover:bg-[#2d8bc9]"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-[#333] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="font-bold">{h.points} pts</div>
                          <div className="text-gray-400">{h.saison} P{h.phase}</div>
                          {h.echelon === 'N' && <div className="text-yellow-400">N{h.place}</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="ml-14 mt-2 flex justify-between text-gray-600 text-xs">
                {historiqueReversed.length > 0 && (
                  <>
                    <span>{historiqueReversed[0]?.saison}</span>
                    {historiqueReversed.length > 2 && <span>{historiqueReversed[Math.floor(historiqueReversed.length / 2)]?.saison}</span>}
                    <span>{historiqueReversed[historiqueReversed.length - 1]?.saison}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tableau des parties */}
        {parties.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                <i className="fas fa-table-tennis mr-2 text-[#3b9fd8]"></i>Parties ({parties.length})
              </h2>
              {parties.length > 20 && (
                <button
                  onClick={() => setShowAllParties(!showAllParties)}
                  className="text-[#3b9fd8] hover:text-white text-sm transition-colors"
                >
                  {showAllParties ? 'Voir moins' : `Voir toutes (${parties.length})`}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Rés.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Adversaire</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Cls.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Points</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">Coef.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {partiesToShow.map((partie, index) => (
                    <tr key={index} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {partie.dateFormatted || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${partie.victoire ? 'bg-green-500' : 'bg-red-500'} text-white font-bold text-sm`}>
                          {partie.victoire ? 'V' : 'D'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {partie.adversaire}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-400">
                        {partie.adversaireClassement || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${partie.victoire ? 'text-green-400' : 'text-red-400'}`}>
                        {partie.victoire ? '+' : ''}{partie.pointsResultat}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        {partie.coefficient}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historique classements par saison */}
        {historique.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-history mr-2 text-[#3b9fd8]"></i>Historique des classements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {historique.map((h, index) => (
                <div key={index} className="bg-[#111] border border-[#333] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#3b9fd8]">{h.points}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {h.saison} - P{h.phase}
                  </div>
                  {h.echelon === 'N' && h.place && (
                    <div className="mt-1 text-xs text-yellow-400 font-bold">N{h.place}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {!isRefreshing && parties.length === 0 && historique.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8">
            <div className="text-center mb-6">
              <i className={`fas ${smartpingFailed ? 'fa-exclamation-triangle text-yellow-500' : 'fa-info-circle text-gray-600'} text-5xl mb-4`}></i>
              <h3 className="text-xl font-bold text-white mb-2">
                {smartpingFailed ? 'Service FFTT temporairement indisponible' : 'Données détaillées non chargées'}
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {smartpingFailed
                  ? "Impossible de récupérer les parties et l'historique. Les données ci-dessous proviennent de la dernière synchronisation."
                  : 'Cliquez sur "Actualiser" pour charger les parties et l\'historique depuis la FFTT.'}
              </p>
            </div>
            {smartpingFailed && (player.fftt_points_ancien != null || player.fftt_points_initial != null) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#333]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#3b9fd8]">{displayPoints}</div>
                  <div className="text-gray-500 text-xs mt-1">Points actuels</div>
                </div>
                {player.fftt_points_ancien != null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${displayPoints - player.fftt_points_ancien >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {displayPoints - player.fftt_points_ancien >= 0 ? '+' : ''}{displayPoints - player.fftt_points_ancien}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">vs mois précédent</div>
                  </div>
                )}
                {player.fftt_points_initial != null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${displayPoints - player.fftt_points_initial >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {displayPoints - player.fftt_points_initial >= 0 ? '+' : ''}{displayPoints - player.fftt_points_initial}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">depuis début saison</div>
                  </div>
                )}
              </div>
            )}
            {!smartpingFailed && (
              <div className="text-center mt-4">
                <button onClick={refreshData} disabled={isRefreshing}
                  className="px-6 py-2 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-all disabled:opacity-50">
                  <i className="fas fa-sync mr-2"></i>Charger les données
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
