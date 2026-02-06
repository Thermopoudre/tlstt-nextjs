'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { TeamCardSkeleton } from '@/components/ui/Skeleton'

interface Team {
  libequipe: string
  libepr: string
  libdivision: string
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  classement?: {
    clt: string
    equipe: string
    joue: string
    pts: string
    vic: string
    def: string
    nul: string
  }[]
}

export default function EquipesPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState('')

  useEffect(() => {
    document.title = 'Equipes - TLSTT'
    
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/equipes')
        const data = await response.json()
        if (data.equipes) {
          setTeams(data.equipes)
        }
        if (data.source) {
          setSource(data.source)
        }
        if (data.equipes?.length === 0 && data.ffttError) {
          // Pas d'erreur visible, juste pas de donnees
        }
      } catch (err) {
        setError('Impossible de charger les equipes')
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
              <i className="fas fa-users mr-3 text-[#3b9fd8]"></i>
              NOS <span className="text-[#3b9fd8]">EQUIPES</span>
            </h1>
            <p className="text-xl text-gray-400">Championnats par equipes - Saison 2025/2026</p>
            {source && (
              <p className="text-sm text-gray-500 mt-2">
                <i className={`fas ${source === 'FFTT Live' ? 'fa-wifi text-green-500' : 'fa-database text-[#3b9fd8]'} mr-1`}></i>
                Source : {source}
              </p>
            )}
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
            <h3 className="text-xl font-bold text-white mb-2">Aucune equipe trouvee</h3>
            <p className="text-gray-500 mb-6">Les donnees des equipes ne sont pas encore disponibles pour cette saison.</p>
            <div className="bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-[#3b9fd8]">
                <i className="fas fa-info-circle mr-2"></i>
                Les equipes seront affichees une fois les donnees synchronisees avec la FFTT.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, index) => (
              <div key={index} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-1">
                {/* Header equipe */}
                <div className="bg-gradient-to-r from-[#0f2b4a] to-[#1a1a1a] p-5 text-white border-b border-[#333]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{team.libequipe}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        <i className="fas fa-trophy mr-1 text-[#3b9fd8]"></i>
                        {team.libdivision || team.libepr}
                      </p>
                    </div>
                    {team.cla > 0 && (
                      <div className="bg-[#3b9fd8] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                        {team.cla}
                        <span className="text-[8px] absolute mt-7">e</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="p-5">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="bg-[#111] rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">{team.joue || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Joues</p>
                    </div>
                    <div className="bg-[#111] rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-500">{team.vic || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gag.</p>
                    </div>
                    <div className="bg-[#111] rounded-lg p-3">
                      <p className="text-2xl font-bold text-yellow-500">{team.nul || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Nuls</p>
                    </div>
                    <div className="bg-[#111] rounded-lg p-3">
                      <p className="text-2xl font-bold text-red-500">{team.def || 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Per.</p>
                    </div>
                    <div className="bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-lg p-3">
                      <p className="text-2xl font-bold text-[#3b9fd8]">{team.pts || 0}</p>
                      <p className="text-[10px] text-[#3b9fd8] uppercase tracking-wider">Pts</p>
                    </div>
                  </div>

                  {/* Barre de progression V/N/D */}
                  {team.joue > 0 && (
                    <div className="mt-4">
                      <div className="flex h-2 rounded-full overflow-hidden bg-[#111]">
                        {team.vic > 0 && (
                          <div className="bg-green-500" style={{ width: `${(team.vic / team.joue) * 100}%` }}></div>
                        )}
                        {team.nul > 0 && (
                          <div className="bg-yellow-500" style={{ width: `${(team.nul / team.joue) * 100}%` }}></div>
                        )}
                        {team.def > 0 && (
                          <div className="bg-red-500" style={{ width: `${(team.def / team.joue) * 100}%` }}></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Classement de la poule */}
                {team.classement && team.classement.length > 0 && (
                  <div className="border-t border-[#333] p-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">
                      <i className="fas fa-list-ol mr-2 text-[#3b9fd8]"></i>
                      Classement de la poule
                    </h4>
                    <div className="space-y-1">
                      {team.classement.map((c, ci) => {
                        const isUs = c.equipe.toLowerCase().includes('toulon') || 
                                     c.equipe.toLowerCase().includes('seyne') ||
                                     c.equipe.toLowerCase().includes('tlstt')
                        return (
                          <div key={ci} className={`flex items-center gap-3 px-3 py-1.5 rounded text-sm ${
                            isUs ? 'bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 text-white font-semibold' : 'text-gray-400'
                          }`}>
                            <span className="w-6 text-center font-bold">{c.clt}</span>
                            <span className="flex-1 truncate">{c.equipe}</span>
                            <span className="w-8 text-center">{c.pts}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4">
          <div className="flex gap-3">
            <i className="fas fa-info-circle text-[#3b9fd8] mt-0.5"></i>
            <div>
              <p className="font-medium text-white">Donnees FFTT</p>
              <p className="text-sm text-gray-400">Les classements et resultats sont synchronises avec la FFTT. Les donnees sont mises a jour regulierement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
