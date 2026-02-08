'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { TeamCardSkeleton } from '@/components/ui/Skeleton'

interface Team {
  id: number
  libequipe: string
  libepr: string
  libdivision: string
  pool: string
  phase: number
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  link_fftt: string
}

// Couleur par niveau de division
function getDivisionColor(division: string): string {
  if (division.includes('Nationale') || division.includes('Pre-Nationale')) return '#e74c3c'
  if (division.includes('Regionale')) return '#f39c12'
  if (division.includes('Pre-Regionale')) return '#e67e22'
  if (division.includes('Departementale 1')) return '#3b9fd8'
  if (division.includes('Departementale 2')) return '#2ecc71'
  if (division.includes('Departementale 3')) return '#1abc9c'
  if (division.includes('Departementale 4') || division.includes('Jeunes')) return '#9b59b6'
  return '#3b9fd8'
}

// Badge du classement
function getClassementBadge(cla: number) {
  if (cla === 1) return { bg: 'bg-yellow-500', text: 'text-black', icon: 'fa-trophy' }
  if (cla === 2) return { bg: 'bg-gray-300', text: 'text-black', icon: 'fa-medal' }
  if (cla === 3) return { bg: 'bg-amber-700', text: 'text-white', icon: 'fa-medal' }
  return { bg: 'bg-[#3b9fd8]', text: 'text-white', icon: '' }
}

// Label de la division abrege
function getDivisionShort(division: string): string {
  if (division.includes('Pre-Nationale')) return 'PN'
  if (division.includes('Nationale')) return 'N3'
  if (division.includes('Regionale 1')) return 'R1'
  if (division.includes('Regionale 2')) return 'R2'
  if (division.includes('Regionale 3')) return 'R3'
  if (division.includes('Pre-Regionale')) return 'PR'
  if (division.includes('Departementale 1')) return 'D1'
  if (division.includes('Departementale 2')) return 'D2'
  if (division.includes('Departementale 3')) return 'D3'
  if (division.includes('Departementale 4')) return 'D4'
  return division.substring(0, 3).toUpperCase()
}

export default function EquipesPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState('')
  const [filter, setFilter] = useState<string>('all')

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
      } catch {
        setError('Impossible de charger les equipes')
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  // Regrouper les equipes par niveau
  const divisions = [...new Set(teams.map(t => t.libdivision))]
  
  // Filtrer
  const filteredTeams = filter === 'all' 
    ? teams 
    : teams.filter(t => t.libdivision === filter)

  // Stats globales
  const totalVic = teams.reduce((sum, t) => sum + t.vic, 0)
  const totalNul = teams.reduce((sum, t) => sum + t.nul, 0)
  const totalDef = teams.reduce((sum, t) => sum + t.def, 0)
  const totalMatchs = teams.reduce((sum, t) => sum + t.joue, 0)

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
                <i className="fas fa-database text-[#3b9fd8] mr-1"></i>
                Source : {source} | Phase 2 en cours
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats globales */}
      {teams.length > 0 && totalMatchs > 0 && (
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-[#3b9fd8]">{teams.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Equipes</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{totalMatchs}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Matchs joues</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{totalVic}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Victoires</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-500">{totalNul}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Nuls</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center col-span-2 md:col-span-1">
              <p className="text-3xl font-bold text-red-500">{totalDef}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Defaites</p>
            </div>
          </div>

          {/* Barre globale V/N/D */}
          {totalMatchs > 0 && (
            <div className="mt-4 bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Bilan global Phase 2</span>
                <span>{Math.round((totalVic / totalMatchs) * 100)}% de victoires</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-[#111]">
                {totalVic > 0 && (
                  <div className="bg-green-500 transition-all" style={{ width: `${(totalVic / totalMatchs) * 100}%` }}></div>
                )}
                {totalNul > 0 && (
                  <div className="bg-yellow-500 transition-all" style={{ width: `${(totalNul / totalMatchs) * 100}%` }}></div>
                )}
                {totalDef > 0 && (
                  <div className="bg-red-500 transition-all" style={{ width: `${(totalDef / totalMatchs) * 100}%` }}></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtres par division */}
      {teams.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-[#3b9fd8] text-white' 
                  : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:border-[#3b9fd8]/50'
              }`}
            >
              Toutes ({teams.length})
            </button>
            {divisions.map(div => {
              const count = teams.filter(t => t.libdivision === div).length
              return (
                <button
                  key={div}
                  onClick={() => setFilter(div)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === div 
                      ? 'text-white' 
                      : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:border-[#3b9fd8]/50'
                  }`}
                  style={filter === div ? { backgroundColor: getDivisionColor(div) } : undefined}
                >
                  {getDivisionShort(div)} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const divColor = getDivisionColor(team.libdivision)
              const badge = getClassementBadge(team.cla)
              const winRate = team.joue > 0 ? Math.round((team.vic / team.joue) * 100) : 0
              
              return (
                <div key={team.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-1 group">
                  {/* Header equipe avec badge division */}
                  <div className="relative p-5 text-white border-b border-[#333]" style={{ background: `linear-gradient(135deg, ${divColor}22 0%, #1a1a1a 100%)` }}>
                    {/* Badge division */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: divColor, color: '#fff' }}>
                      {getDivisionShort(team.libdivision)}
                      {team.pool && <span className="ml-1">P{team.pool}</span>}
                    </div>

                    <h3 className="text-xl font-bold pr-16">{team.libequipe}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      <i className="fas fa-trophy mr-1" style={{ color: divColor }}></i>
                      {team.libdivision}
                      {team.pool && <span className="text-gray-500"> - Poule {team.pool}</span>}
                    </p>
                    
                    {/* Phase info */}
                    {team.link_fftt && (
                      <p className="text-xs text-gray-500 mt-1">
                        <i className="fas fa-history mr-1"></i>
                        {team.link_fftt}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="p-5">
                    {team.joue > 0 ? (
                      <>
                        {/* Classement */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {team.cla > 0 && (
                              <div className={`${badge.bg} ${badge.text} w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold`}>
                                {team.cla}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold">
                                {team.cla === 1 ? 'Champion de poule' : team.cla === 2 ? '2e de poule' : team.cla === 3 ? '3e de poule' : `${team.cla}e de poule`}
                              </p>
                              <p className="text-xs text-gray-500">Phase 2 - {team.joue} matchs</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: divColor }}>{team.pts}</p>
                            <p className="text-xs text-gray-500">points</p>
                          </div>
                        </div>

                        {/* V/N/D */}
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                            <p className="text-xl font-bold text-green-500">{team.vic}</p>
                            <p className="text-[10px] text-green-400/70 uppercase">Victoires</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                            <p className="text-xl font-bold text-yellow-500">{team.nul}</p>
                            <p className="text-[10px] text-yellow-400/70 uppercase">Nuls</p>
                          </div>
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                            <p className="text-xl font-bold text-red-500">{team.def}</p>
                            <p className="text-[10px] text-red-400/70 uppercase">Defaites</p>
                          </div>
                        </div>

                        {/* Barre de progression V/N/D */}
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
                        <p className="text-xs text-gray-500 mt-1 text-right">{winRate}% de victoires</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-clock text-2xl text-gray-600 mb-2"></i>
                        <p className="text-gray-500 text-sm">Phase 2 - En attente de resultats</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4">
          <div className="flex gap-3">
            <i className="fas fa-info-circle text-[#3b9fd8] mt-0.5"></i>
            <div>
              <p className="font-medium text-white">Donnees FFTT - Saison 2025/2026</p>
              <p className="text-sm text-gray-400">
                Les resultats affiches proviennent de la Phase 2. Le club engage {teams.length} equipes cette saison, 
                de la Nationale 3 a la Departementale 4 Jeunes. Les donnees sont mises a jour automatiquement apres chaque journee de championnat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
