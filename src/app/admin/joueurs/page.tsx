'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Player {
  id: number
  smartping_licence: string
  first_name: string
  last_name: string
  fftt_points: number
  fftt_points_exact: number | null
  category: string | null
  last_sync: string | null
  admin_notes: string | null
}

export default function AdminJoueursPage() {
  const supabase = createClientComponentClient()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('fftt_points_exact', { ascending: false, nullsFirst: false })

    if (data) setPlayers(data)
    setLoading(false)
  }

  const syncAllPlayers = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const response = await fetch('/api/sync-all-players')
      const data = await response.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: `${data.updated} joueurs synchronisés !` })
        fetchPlayers()
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de synchronisation' })
    }
    setSyncing(false)
  }

  const filteredPlayers = players.filter(p => 
    p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.smartping_licence?.includes(search)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Joueurs</h1>
          <p className="text-gray-600 mt-1">{players.length} joueurs dans le club</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={syncAllPlayers}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
          >
            <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i>
            Sync FFTT
          </button>
          <Link href="/admin/joueurs/nouveau" className="btn-primary flex items-center gap-2">
            <i className="fas fa-plus"></i>
            Ajouter
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-primary">{players.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">1000+ pts</p>
          <p className="text-2xl font-bold text-green-600">
            {players.filter(p => (p.fftt_points_exact || p.fftt_points) >= 1000).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">1500+ pts</p>
          <p className="text-2xl font-bold text-blue-600">
            {players.filter(p => (p.fftt_points_exact || p.fftt_points) >= 1500).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">2000+ pts</p>
          <p className="text-2xl font-bold text-purple-600">
            {players.filter(p => (p.fftt_points_exact || p.fftt_points) >= 2000).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Rechercher par nom ou licence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-600">Joueur</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">Licence</th>
                <th className="px-4 lg:px-6 py-4 text-right text-sm font-semibold text-gray-600">Points</th>
                <th className="px-4 lg:px-6 py-4 text-center text-sm font-semibold text-gray-600 hidden md:table-cell">Catégorie</th>
                <th className="px-4 lg:px-6 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <i className="fas fa-spinner fa-spin text-2xl"></i>
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun joueur trouvé
                  </td>
                </tr>
              ) : (
                filteredPlayers.slice(0, 50).map((player, index) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-primary'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{player.first_name} {player.last_name}</p>
                          <p className="text-xs text-gray-500 sm:hidden">{player.smartping_licence}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-gray-600 hidden sm:table-cell">{player.smartping_licence}</td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <span className="font-bold text-primary">
                        {player.fftt_points_exact || player.fftt_points || 500}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-center hidden md:table-cell">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {player.category || '-'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/joueurs/${player.smartping_licence}`}
                          target="_blank"
                          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                          title="Voir"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link
                          href={`/admin/joueurs/${player.id}`}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredPlayers.length > 50 && (
          <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
            Affichage des 50 premiers résultats sur {filteredPlayers.length}
          </div>
        )}
      </div>
    </div>
  )
}
