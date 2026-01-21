'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  first_name: string
  last_name: string
  smartping_licence: string
  fftt_points: number
  fftt_points_exact: number | null
  category: string | null
  last_sync: string | null
  // Données enrichies depuis API
  pointsMensuels?: number
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
}

interface Partie {
  date: string
  adversaire: string
  adversaireClassement: string
  victoire: boolean
  pointsResultat: number
  coefficient: number
  journee: string
}

interface Historique {
  saison: string
  phase: string
  points: number
  echelon?: string
  place?: string
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

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/player/${player.smartping_licence}`)
      const data = await response.json()

      if (data.player) {
        setPlayer(data.player)
      }
      if (data.parties) {
        setParties(data.parties)
      }
      if (data.historique) {
        setHistorique(data.historique)
      }
      if (data.stats) {
        setStats(data.stats)
      }
      setSource(data.source || 'api')
      setLastRefresh(new Date().toLocaleTimeString('fr-FR'))
    } catch (error) {
      console.error('Erreur refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [player.smartping_licence])

  // Rafraîchir au chargement (après affichage initial)
  useEffect(() => {
    // Vérifier si les données ont plus d'1 heure
    const lastSync = player.last_sync ? new Date(player.last_sync) : null
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    if (!lastSync || lastSync < oneHourAgo) {
      // Données périmées, rafraîchir
      refreshData()
    }
  }, [player.last_sync, refreshData])

  // Parser le classement national
  const isNational = player.category?.match(/^N(\d+)$/i)
  const nationalRank = isNational ? parseInt(isNational[1]) : null

  // Points à afficher (priorité: pointsMensuels > fftt_points_exact > fftt_points)
  const displayPoints = player.pointsMensuels || player.fftt_points_exact || player.fftt_points || 0

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li>
                <Link href="/" className="hover:text-[#5bc0de] transition-colors">Accueil</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/joueurs" className="hover:text-[#5bc0de] transition-colors">Joueurs</Link>
              </li>
              <li>/</li>
              <li className="text-white font-semibold">
                {player.first_name} {player.last_name}
              </li>
            </ol>
          </nav>

          {/* Header joueur */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-[#5bc0de] flex items-center justify-center text-white text-4xl font-bold">
                {player.first_name?.[0]}{player.last_name?.[0]}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {player.first_name} <span className="text-[#5bc0de]">{player.last_name}</span>
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/70">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-id-card"></i>
                    Licence: {player.smartping_licence}
                  </span>
                  {nationalRank && (
                    <span className="bg-[#5bc0de] text-white px-3 py-1 rounded-full text-sm font-bold">
                      <i className="fas fa-flag mr-1"></i> N{nationalRank} France
                    </span>
                  )}
                  {player.categorie && (
                    <span className="flex items-center gap-2">
                      <i className="fas fa-user-tag"></i>
                      {player.categorie}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Bouton refresh */}
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-[#5bc0de] text-white rounded-full font-semibold hover:bg-[#4ab0ce] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <i className={`fas fa-sync ${isRefreshing ? 'animate-spin' : ''}`}></i>
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
            </div>

            {/* Indicateur de source */}
            {lastRefresh && (
              <div className="mt-4 text-center md:text-right text-white/50 text-sm">
                <i className={`fas ${source === 'api' ? 'fa-check-circle text-green-400' : 'fa-database text-yellow-400'} mr-1`}></i>
                {source === 'api' ? 'Données FFTT' : 'Données cache'} - {lastRefresh}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {/* Stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-[#5bc0de]">{displayPoints}</div>
            <div className="text-white/60 text-sm mt-1">Points mensuels</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <div className={`text-4xl font-bold ${(player.progressionMensuelle || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(player.progressionMensuelle || 0) > 0 ? '+' : ''}{player.progressionMensuelle || 0}
            </div>
            <div className="text-white/60 text-sm mt-1">Ce mois</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <div className={`text-4xl font-bold ${(player.progressionAnnuelle || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(player.progressionAnnuelle || 0) > 0 ? '+' : ''}{player.progressionAnnuelle || 0}
            </div>
            <div className="text-white/60 text-sm mt-1">Cette année</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white">{stats?.total || 0}</div>
            <div className="text-white/60 text-sm mt-1">Parties jouées</div>
          </div>
        </div>

        {/* Rangs */}
        {(player.rangDepartemental || player.rangRegional || player.rangNational) && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-medal mr-2 text-[#5bc0de]"></i>Classements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {player.rangDepartemental && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5bc0de]">{player.rangDepartemental}</div>
                  <div className="text-white/60 text-sm">Départemental</div>
                </div>
              )}
              {player.rangRegional && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5bc0de]">{player.rangRegional}</div>
                  <div className="text-white/60 text-sm">Régional</div>
                </div>
              )}
              {player.rangNational && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5bc0de]">{player.rangNational}</div>
                  <div className="text-white/60 text-sm">National</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Victoires/Défaites */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-green-400">{stats.victoires}</div>
              <div className="text-green-300/70 text-sm mt-1">Victoires</div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-red-400">{stats.defaites}</div>
              <div className="text-red-300/70 text-sm mt-1">Défaites</div>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-400">{stats.pourcentage}%</div>
              <div className="text-blue-300/70 text-sm mt-1">Taux victoire</div>
            </div>
            <div className={`${stats.bilan >= 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-2xl p-6 text-center`}>
              <div className={`text-4xl font-bold ${stats.bilan >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.bilan > 0 ? '+' : ''}{stats.bilan}
              </div>
              <div className="text-white/60 text-sm mt-1">Bilan pts</div>
            </div>
          </div>
        )}

        {/* Tableau des parties */}
        {parties.length > 0 && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-table-tennis mr-2 text-[#5bc0de]"></i>Dernières parties
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white/70">Résultat</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Adversaire</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-white/70">Cls.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-white/70">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {parties.map((partie, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white/80">
                        {partie.date ? new Date(partie.date).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-8 h-8 rounded-full ${partie.victoire ? 'bg-green-500' : 'bg-red-500'} text-white font-bold flex items-center justify-center mx-auto`}>
                          {partie.victoire ? 'V' : 'D'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {partie.adversaire}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white/70">
                        {partie.adversaireClassement}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${partie.victoire ? 'text-green-400' : 'text-red-400'}`}>
                        {partie.victoire ? '+' : ''}{partie.pointsResultat}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historique classement */}
        {historique.length > 0 && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-history mr-2 text-[#5bc0de]"></i>Historique des classements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {historique.map((h, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#5bc0de]">{h.points}</div>
                  <div className="text-white/60 text-xs mt-1">
                    {h.saison} - P{h.phase}
                  </div>
                  {h.echelon === 'N' && h.place && (
                    <div className="mt-1 text-xs text-yellow-400">
                      N{h.place}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {!isRefreshing && parties.length === 0 && historique.length === 0 && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <i className="fas fa-info-circle text-6xl text-white/30 mb-4"></i>
            <h3 className="text-xl font-bold text-white/80 mb-2">Données limitées</h3>
            <p className="text-white/60">Cliquez sur "Actualiser" pour charger les parties et l'historique depuis la FFTT.</p>
          </div>
        )}
      </div>
    </div>
  )
}
