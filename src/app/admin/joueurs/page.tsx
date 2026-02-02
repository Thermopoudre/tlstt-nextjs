'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Player {
  id: number
  smartping_licence: string
  first_name: string
  last_name: string
  fftt_points: number
  fftt_points_exact: number | null
  category: string | null
}

export default function AdminJoueursPage() {
  const supabase = createClient()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPlayers() }, [])

  const fetchPlayers = async () => {
    setLoading(true)
    const { data } = await supabase.from('players').select('*').order('fftt_points_exact', { ascending: false, nullsFirst: false })
    if (data) setPlayers(data)
    setLoading(false)
  }

  const filteredPlayers = players.filter(p => 
    p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.smartping_licence?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Joueurs</h1>
          <p className="text-gray-600 mt-1">{players.length} joueurs</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4">
        <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field" />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Joueur</th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-600">Points</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
            ) : filteredPlayers.slice(0, 50).map((player, i) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-primary">{i + 1}</span>
                    <div>
                      <p className="font-semibold">{player.first_name} {player.last_name}</p>
                      <p className="text-xs text-gray-500">{player.smartping_licence}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-bold text-primary">{player.fftt_points_exact || player.fftt_points || 500}</td>
                <td className="px-4 py-4 text-center">
                  <Link href={`/joueurs/${player.smartping_licence}`} target="_blank" className="p-2 text-gray-500 hover:text-primary"><i className="fas fa-eye"></i></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
