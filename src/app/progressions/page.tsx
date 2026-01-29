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
}

interface Stats {
  recordMois: PlayerProgression | null
  enProgression: number
  enRegression: number
  stables: number
  total: number
}

export default function ProgressionsPage() {
  const [topMois, setTopMois] = useState<PlayerProgression[]>([])
  const [tous, setTous] = useState<PlayerProgression[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState('')
  const [ffttStatus, setFfttStatus] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/progressions', { cache: 'no-store' })
        const data = await response.json()
        setTopMois(data.topMois || [])
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
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.prenom.toLowerCase().includes(search.toLowerCase()) ||
    p.licence.includes(search)
  ).slice(0, 30)

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        <Breadcrumbs className="text-gray-400 mb-6" />

        {/* Status badge */}
        <div className="flex justify-center mb-4">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            source === 'FFTT Live' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-yellow-900'
          }`}>
            <i className={`fas fa-${source === 'FFTT Live' ? 'check-circle' : 'info-circle'} mr-2`}></i>
            {source || 'Chargement...'}
            {ffttStatus && source !== 'FFTT Live' && ` (${ffttStatus})`}
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#5bc0de] mb-2">Pépites</h1>
          <p className="text-gray-300">Classement des joueurs par niveau</p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              <i className="fas fa-clock mr-1"></i>
              Dernière mise à jour : {new Date(lastUpdate).toLocaleString('fr-FR')}
            </p>
          )}
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{stats?.enProgression || 0}</p>
              <p className="text-sm text-green-300"><i className="fas fa-arrow-up mr-1"></i>En progression</p>
            </div>
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{stats?.enRegression || 0}</p>
              <p className="text-sm text-red-300"><i className="fas fa-arrow-down mr-1"></i>En régression</p>
            </div>
            <div className="bg-gray-500/20 border border-gray-500/40 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-300">{stats?.stables || 0}</p>
              <p className="text-sm text-gray-400"><i className="fas fa-minus mr-1"></i>Stables</p>
            </div>
            <div className="bg-[#5bc0de]/20 border border-[#5bc0de]/40 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-[#5bc0de]">{stats?.total || 0}</p>
              <p className="text-sm text-[#5bc0de]/80"><i className="fas fa-users mr-1"></i>Joueurs analysés</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-gray-100 rounded-t-3xl min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-5 py-8">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-bold text-[#0f3057] flex items-center gap-2">
                  <i className="fas fa-list-ol"></i>
                  Classement par Points <span className="text-sm font-normal text-gray-500">(Top 30)</span>
                </h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rang</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Joueur</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Points actuels</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPlayers.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50">
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
                        <Link href={`/joueurs/${player.licence}`} className="hover:text-[#5bc0de]">
                          <p className="font-semibold text-gray-900">{player.prenom} {player.nom}</p>
                          <p className="text-xs text-gray-500">{player.licence}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-[#0f3057] text-lg">{player.pointsActuels}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
