'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { TeamCardSkeleton } from '@/components/ui/Skeleton'

interface Team {
  libequipe: string
  libepr: string
  cla: number
  joue: number
  pts: number
}

export default function EquipesPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set document title for client component
    document.title = 'Équipes - TLSTT'
    
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/equipes')
        const data = await response.json()
        if (data.equipes) {
          setTeams(data.equipes)
        }
      } catch (err) {
        setError('Impossible de charger les équipes')
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#3b9fd8] mb-2">
              <i className="fas fa-users mr-3"></i>
              Équipes
            </h1>
            <p className="text-gray-400">Résultats et classements du championnat par équipes</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
            <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
            <p className="text-red-400">{error}</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-lg p-12 text-center">
            <i className="fas fa-users text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">Aucune équipe trouvée</h3>
            <p className="text-gray-500 mb-6">Les données des équipes ne sont pas encore disponibles.</p>
            <div className="bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-[#3b9fd8]">
                <i className="fas fa-info-circle mr-2"></i>
                Les équipes seront affichées une fois la saison démarrée et les données synchronisées avec la FFTT.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, index) => (
              <div key={index} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-colors">
                <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] p-4 text-white border-b border-[#333]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{team.libequipe}</h3>
                    <span className="bg-[#3b9fd8]/20 text-[#3b9fd8] px-3 py-1 rounded-full text-sm">
                      {team.libepr}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-white">{team.cla || '-'}</p>
                      <p className="text-xs text-gray-500">Classement</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-500">{team.pts || 0}</p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[#3b9fd8]">{team.joue || 0}</p>
                      <p className="text-xs text-gray-500">Matchs</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4">
          <div className="flex gap-3">
            <i className="fas fa-info-circle text-[#3b9fd8] mt-0.5"></i>
            <div>
              <p className="font-medium text-white">Synchronisation automatique</p>
              <p className="text-sm text-gray-400">Les classements et résultats sont synchronisés automatiquement depuis la FFTT.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
