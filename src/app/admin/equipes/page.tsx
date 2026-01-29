'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Team {
  id: number
  name: string
  division: string
  captain: string | null
  players_count: number
  rank: number | null
  points: number
}

export default function AdminEquipesPage() {
  const supabase = createClientComponentClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    // Simuler les équipes depuis l'API FFTT ou la BDD
    setTeams([
      { id: 1, name: 'Équipe 1', division: 'Départementale 1', captain: 'Brice BOURGEOIS', players_count: 6, rank: 2, points: 12 },
      { id: 2, name: 'Équipe 2', division: 'Départementale 2', captain: 'Cedric CEUNINCK', players_count: 6, rank: 1, points: 15 },
      { id: 3, name: 'Équipe 3', division: 'Départementale 3', captain: 'Alexis DELCROIX', players_count: 6, rank: 3, points: 10 },
      { id: 4, name: 'Équipe 4', division: 'Départementale 4', captain: 'Nicolas DELARUE', players_count: 6, rank: 4, points: 8 },
    ])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Équipes</h1>
          <p className="text-gray-600 mt-1">Gérez les équipes du club</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <i className="fas fa-sync"></i>
            Sync FFTT
          </button>
          <Link href="/admin/equipes/nouvelle" className="btn-primary flex items-center gap-2">
            <i className="fas fa-plus"></i>
            Nouvelle équipe
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{team.name}</h3>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {team.division}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{team.rank || '-'}</p>
                    <p className="text-xs text-gray-500">Classement</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{team.points}</p>
                    <p className="text-xs text-gray-500">Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{team.players_count}</p>
                    <p className="text-xs text-gray-500">Joueurs</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-gray-500">Capitaine:</span>
                    <span className="font-medium ml-1">{team.captain || 'Non défini'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/equipes`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                    >
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link
                      href={`/admin/equipes/${team.id}`}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
          <div>
            <p className="font-medium text-blue-800">Synchronisation automatique</p>
            <p className="text-sm text-blue-600">Les classements et résultats sont synchronisés automatiquement depuis la FFTT.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
