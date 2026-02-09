'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { TeamCardSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
interface PhaseStats {
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  division: string
  pool: string
}

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
  p1: PhaseStats
}

type PhaseFilter = 1 | 2

// ============================================
// HELPERS
// ============================================
function getDivisionColor(division: string): string {
  if (division.includes('Nationale') || division.includes('Pre-Nationale')) return '#e74c3c'
  if (division.includes('Regionale 1')) return '#f39c12'
  if (division.includes('Regionale 2')) return '#e67e22'
  if (division.includes('Regionale 3')) return '#d35400'
  if (division.includes('Pre-Regionale')) return '#e67e22'
  if (division.includes('Departementale 1')) return '#3b9fd8'
  if (division.includes('Departementale 2')) return '#2ecc71'
  if (division.includes('Departementale 3')) return '#1abc9c'
  if (division.includes('Departementale 4') || division.includes('Jeunes')) return '#9b59b6'
  return '#3b9fd8'
}

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

function getRankLabel(cla: number): string {
  if (cla === 1) return '1er'
  return `${cla}e`
}

function getRankStyle(cla: number) {
  if (cla === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', text: 'text-black', ring: 'ring-yellow-400/40' }
  if (cla === 2) return { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-black', ring: 'ring-gray-300/40' }
  if (cla === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-amber-800', text: 'text-white', ring: 'ring-amber-600/40' }
  return { bg: 'bg-gradient-to-br from-[#3b9fd8] to-[#2980b9]', text: 'text-white', ring: 'ring-[#3b9fd8]/30' }
}

function getPhaseStats(team: Team, phase: PhaseFilter) {
  if (phase === 1) {
    return {
      cla: team.p1.cla,
      joue: team.p1.joue,
      pts: team.p1.pts,
      vic: team.p1.vic,
      def: team.p1.def,
      nul: team.p1.nul,
      division: team.p1.division || team.libdivision,
      pool: team.p1.pool || '',
    }
  }
  return {
    cla: team.cla,
    joue: team.joue,
    pts: team.pts,
    vic: team.vic,
    def: team.def,
    nul: team.nul,
    division: team.libdivision,
    pool: team.pool,
  }
}

// ============================================
// COMPONENT
// ============================================
export default function EquipesPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState('')
  const [activePhase, setActivePhase] = useState<PhaseFilter>(2)
  const [divisionFilter, setDivisionFilter] = useState<string>('all')

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

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Teams avec stats de la phase active
  const teamsWithPhaseStats = teams.map(team => ({
    ...team,
    active: getPhaseStats(team, activePhase),
  }))

  // Teams qui ont des données pour cette phase (joue > 0)
  const teamsWithData = teamsWithPhaseStats.filter(t => t.active.joue > 0)
  const teamsWithoutData = teamsWithPhaseStats.filter(t => t.active.joue === 0)

  // Classement interne du club (trié par pts desc, puis vic desc)
  const rankedTeams = [...teamsWithData].sort((a, b) => {
    if (b.active.pts !== a.active.pts) return b.active.pts - a.active.pts
    if (b.active.vic !== a.active.vic) return b.active.vic - a.active.vic
    return a.active.def - b.active.def
  })

  // Divisions disponibles pour cette phase
  const phaseDivisions = [...new Set(teamsWithPhaseStats.map(t => t.active.division))].filter(Boolean)

  // Filtrer par division
  const filteredTeams = divisionFilter === 'all'
    ? teamsWithPhaseStats
    : teamsWithPhaseStats.filter(t => t.active.division === divisionFilter)

  // Stats globales
  const totalVic = teamsWithData.reduce((sum, t) => sum + t.active.vic, 0)
  const totalNul = teamsWithData.reduce((sum, t) => sum + t.active.nul, 0)
  const totalDef = teamsWithData.reduce((sum, t) => sum + t.active.def, 0)
  const totalMatchs = teamsWithData.reduce((sum, t) => sum + t.active.joue, 0)
  const totalPts = teamsWithData.reduce((sum, t) => sum + t.active.pts, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
              <i className="fas fa-users mr-3 text-[#3b9fd8]"></i>
              NOS <span className="text-[#3b9fd8]">EQUIPES</span>
            </h1>
            <p className="text-xl text-gray-400 mb-3">Championnats par equipes - Saison 2025/2026</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="/api/export/classement-pdf"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-[#3b9fd8]/30 text-[#3b9fd8] rounded-lg text-sm hover:bg-[#3b9fd8]/10 transition-colors"
              >
                <i className="fas fa-file-pdf"></i>
                Exporter PDF
              </a>
              {source && (
                <span className="text-sm text-gray-500">
                  <i className="fas fa-database text-[#3b9fd8] mr-1"></i>
                  {source}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PHASE SELECTOR */}
      {/* ============================================ */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Phase 1 Tab */}
          <button
            onClick={() => { setActivePhase(1); setDivisionFilter('all') }}
            className={`relative rounded-xl p-4 md:p-5 border-2 transition-all duration-300 text-left group ${
              activePhase === 1
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-[#1a1a1a] border-[#333] hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <i className={`fas fa-flag-checkered text-lg ${activePhase === 1 ? 'text-amber-400' : 'text-gray-500'}`}></i>
                  <h3 className={`font-bold text-lg ${activePhase === 1 ? 'text-amber-400' : 'text-gray-300'}`}>
                    Phase 1
                  </h3>
                </div>
                <p className={`text-sm ${activePhase === 1 ? 'text-amber-300/70' : 'text-gray-500'}`}>
                  Sep — Dec 2025
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                activePhase === 1
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-gray-700/50 text-gray-500'
              }`}>
                Terminee
              </span>
            </div>
          </button>

          {/* Phase 2 Tab */}
          <button
            onClick={() => { setActivePhase(2); setDivisionFilter('all') }}
            className={`relative rounded-xl p-4 md:p-5 border-2 transition-all duration-300 text-left group ${
              activePhase === 2
                ? 'bg-[#3b9fd8]/10 border-[#3b9fd8] shadow-lg shadow-[#3b9fd8]/10'
                : 'bg-[#1a1a1a] border-[#333] hover:border-[#3b9fd8]/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activePhase === 2 ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${activePhase === 2 ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                  </span>
                  <h3 className={`font-bold text-lg ${activePhase === 2 ? 'text-[#3b9fd8]' : 'text-gray-300'}`}>
                    Phase 2
                  </h3>
                </div>
                <p className={`text-sm ${activePhase === 2 ? 'text-[#3b9fd8]/70' : 'text-gray-500'}`}>
                  Jan — Juin 2026
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${
                activePhase === 2
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700/50 text-gray-500'
              }`}>
                <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                En cours
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* GLOBAL STATS */}
      {/* ============================================ */}
      {teams.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-[#3b9fd8]">{teamsWithData.length}<span className="text-gray-600 text-lg">/{teams.length}</span></p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Equipes actives</p>
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
            <div className="mt-3 bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Bilan global Phase {activePhase}</span>
                <span>{Math.round((totalVic / totalMatchs) * 100)}% de victoires • {totalPts} pts cumules</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-[#111]">
                {totalVic > 0 && (
                  <div className="bg-green-500 transition-all duration-500" style={{ width: `${(totalVic / totalMatchs) * 100}%` }}></div>
                )}
                {totalNul > 0 && (
                  <div className="bg-yellow-500 transition-all duration-500" style={{ width: `${(totalNul / totalMatchs) * 100}%` }}></div>
                )}
                {totalDef > 0 && (
                  <div className="bg-red-500 transition-all duration-500" style={{ width: `${(totalDef / totalMatchs) * 100}%` }}></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* CLASSEMENT TABLE */}
      {/* ============================================ */}
      {rankedTeams.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#333] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fas fa-ranking-star text-[#3b9fd8]"></i>
                Classement interne TLSTT — Phase {activePhase}
              </h2>
              <span className="text-xs text-gray-500 hidden md:block">
                {activePhase === 2 ? 'Mise a jour en temps reel' : 'Resultats finaux'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#111] text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 text-left">Equipe</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Division</th>
                    <th className="px-4 py-3 text-center">Rang</th>
                    <th className="px-4 py-3 text-center">J</th>
                    <th className="px-4 py-3 text-center font-bold">Pts</th>
                    <th className="px-4 py-3 text-center text-green-500">V</th>
                    <th className="px-4 py-3 text-center text-yellow-500">N</th>
                    <th className="px-4 py-3 text-center text-red-500">D</th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">%Vic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {rankedTeams.map((team, index) => {
                    const stats = team.active
                    const divColor = getDivisionColor(stats.division)
                    const winRate = stats.joue > 0 ? Math.round((stats.vic / stats.joue) * 100) : 0
                    const isChampion = stats.cla === 1

                    return (
                      <tr
                        key={team.id}
                        className="hover:bg-[#222] transition-colors group cursor-pointer"
                      >
                        <td className="px-4 py-3 text-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-[#333] text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/equipes/${team.id}`} className="flex items-center gap-2 hover:text-[#3b9fd8] transition-colors">
                            {isChampion && <i className="fas fa-trophy text-yellow-400 text-xs"></i>}
                            <span className="font-semibold text-white group-hover:text-[#3b9fd8]">{team.libequipe}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: divColor }}
                          >
                            {getDivisionShort(stats.division)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stats.cla > 0 ? (
                            <span className="text-[#3b9fd8] font-semibold">{getRankLabel(stats.cla)}</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{stats.joue}</td>
                        <td className="px-4 py-3 text-center font-bold text-[#3b9fd8] text-base">{stats.pts}</td>
                        <td className="px-4 py-3 text-center font-semibold text-green-500">{stats.vic}</td>
                        <td className="px-4 py-3 text-center text-yellow-500/70">{stats.nul}</td>
                        <td className="px-4 py-3 text-center text-red-500/70">{stats.def}</td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[#333] overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${winRate}%` }}></div>
                            </div>
                            <span className="text-gray-400 text-xs w-8">{winRate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* DIVISION FILTERS */}
      {/* ============================================ */}
      {teams.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-th-large text-[#3b9fd8]"></i>
              Details par equipe
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDivisionFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                divisionFilter === 'all' 
                  ? 'bg-[#3b9fd8] text-white' 
                  : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:border-[#3b9fd8]/50'
              }`}
            >
              Toutes ({teams.length})
            </button>
            {phaseDivisions.map(div => {
              const count = teamsWithPhaseStats.filter(t => t.active.division === div).length
              return (
                <button
                  key={div}
                  onClick={() => setDivisionFilter(div)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    divisionFilter === div 
                      ? 'text-white' 
                      : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:border-[#3b9fd8]/50'
                  }`}
                  style={divisionFilter === div ? { backgroundColor: getDivisionColor(div) } : undefined}
                >
                  {getDivisionShort(div)} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TEAM CARDS */}
      {/* ============================================ */}
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
            <p className="text-gray-500 mb-6">Les donnees ne sont pas encore disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const stats = getPhaseStats(team, activePhase)
              const divColor = getDivisionColor(stats.division)
              const winRate = stats.joue > 0 ? Math.round((stats.vic / stats.joue) * 100) : 0
              const rankStyle = getRankStyle(stats.cla)
              
              // Other phase for comparison mini-badge
              const otherPhase = activePhase === 1 ? 2 : 1
              const otherStats = getPhaseStats(team, otherPhase as PhaseFilter)

              return (
                <Link
                  href={`/equipes/${team.id}`}
                  key={team.id}
                  className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-1 group block"
                >
                  {/* Header avec gradient division */}
                  <div className="relative p-5 text-white" style={{ background: `linear-gradient(135deg, ${divColor}20 0%, #1a1a1a 80%)` }}>
                    {/* Badge division */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: divColor, color: '#fff' }}>
                        {getDivisionShort(stats.division)}
                        {stats.pool && <span className="ml-1 opacity-80">P{stats.pool}</span>}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold pr-20 group-hover:text-[#3b9fd8] transition-colors">{team.libequipe}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      <i className="fas fa-trophy mr-1" style={{ color: divColor }}></i>
                      {stats.division}
                      {stats.pool && <span className="text-gray-500"> — Poule {stats.pool}</span>}
                    </p>
                    
                    {/* Phase indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activePhase === 2 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        Phase {activePhase} {activePhase === 2 && '• Live'}
                      </span>
                      {otherStats.joue > 0 && (
                        <span className="text-xs text-gray-600">
                          P{otherPhase}: {otherStats.pts}pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-5">
                    {stats.joue > 0 ? (
                      <>
                        {/* Classement + Points */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {stats.cla > 0 ? (
                              <div className={`${rankStyle.bg} ${rankStyle.text} ${rankStyle.ring} w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ring-4`}>
                                {stats.cla === 1 ? (
                                  <i className="fas fa-trophy text-lg"></i>
                                ) : (
                                  stats.cla
                                )}
                              </div>
                            ) : (
                              <div className="bg-[#333] text-gray-500 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                                —
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold">
                                {stats.cla > 0 
                                  ? stats.cla === 1 ? 'Champion de poule' : `${getRankLabel(stats.cla)} de poule`
                                  : 'Classement en cours'
                                }
                              </p>
                              <p className="text-xs text-gray-500">{stats.joue} match{stats.joue > 1 ? 's' : ''} joue{stats.joue > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold" style={{ color: divColor }}>{stats.pts}</p>
                            <p className="text-xs text-gray-500">points</p>
                          </div>
                        </div>

                        {/* V/N/D */}
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                            <p className="text-xl font-bold text-green-500">{stats.vic}</p>
                            <p className="text-[10px] text-green-400/70 uppercase">Victoires</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                            <p className="text-xl font-bold text-yellow-500">{stats.nul}</p>
                            <p className="text-[10px] text-yellow-400/70 uppercase">Nuls</p>
                          </div>
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                            <p className="text-xl font-bold text-red-500">{stats.def}</p>
                            <p className="text-[10px] text-red-400/70 uppercase">Defaites</p>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="flex h-2 rounded-full overflow-hidden bg-[#111]">
                          {stats.vic > 0 && (
                            <div className="bg-green-500 transition-all duration-500" style={{ width: `${(stats.vic / stats.joue) * 100}%` }}></div>
                          )}
                          {stats.nul > 0 && (
                            <div className="bg-yellow-500 transition-all duration-500" style={{ width: `${(stats.nul / stats.joue) * 100}%` }}></div>
                          )}
                          {stats.def > 0 && (
                            <div className="bg-red-500 transition-all duration-500" style={{ width: `${(stats.def / stats.joue) * 100}%` }}></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">{winRate}% de victoires</p>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <i className="fas fa-hourglass-half text-3xl text-gray-600 mb-3"></i>
                        <p className="text-gray-400 font-medium">En attente de resultats</p>
                        <p className="text-xs text-gray-600 mt-1">Phase {activePhase} - Pas encore de matchs</p>
                        {/* Show other phase mini-stats if available */}
                        {otherStats.joue > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#333]">
                            <p className="text-xs text-gray-500 mb-1">Bilan Phase {otherPhase} :</p>
                            <div className="flex items-center justify-center gap-3 text-xs">
                              <span className="text-green-500 font-semibold">{otherStats.vic}V</span>
                              <span className="text-yellow-500">{otherStats.nul}N</span>
                              <span className="text-red-500">{otherStats.def}D</span>
                              <span className="text-gray-400">({otherStats.pts}pts)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* TEAMS WITHOUT DATA */}
        {/* ============================================ */}
        {teamsWithoutData.length > 0 && divisionFilter === 'all' && teamsWithData.length > 0 && (
          <div className="mt-6 bg-[#1a1a1a]/50 border border-[#222] rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-3">
              <i className="fas fa-info-circle mr-1"></i>
              {teamsWithoutData.length} equipe{teamsWithoutData.length > 1 ? 's' : ''} en attente de resultats Phase {activePhase} :
            </p>
            <div className="flex flex-wrap gap-2">
              {teamsWithoutData.map(team => (
                <Link
                  key={team.id}
                  href={`/equipes/${team.id}`}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-gray-400 hover:border-[#3b9fd8]/40 hover:text-white transition-all"
                >
                  {team.libequipe}
                  <span className="ml-1 text-xs text-gray-600">
                    ({getDivisionShort(team.active.division)})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* INFO FOOTER */}
        {/* ============================================ */}
        <div className="mt-8 bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4">
          <div className="flex gap-3">
            <i className="fas fa-info-circle text-[#3b9fd8] mt-0.5"></i>
            <div>
              <p className="font-medium text-white">Donnees FFTT — Saison 2025/2026</p>
              <p className="text-sm text-gray-400">
                Le club engage {teams.length} equipes cette saison, de la Nationale 3 a la Departementale 4 Jeunes.
                {activePhase === 2 
                  ? ' Les donnees de Phase 2 sont mises a jour automatiquement apres chaque journee de championnat.'
                  : ' La Phase 1 est terminee. Consultez la Phase 2 pour les resultats en cours.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
