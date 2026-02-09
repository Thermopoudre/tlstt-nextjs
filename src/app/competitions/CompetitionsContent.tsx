'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Competition {
  id: number
  date: string
  time: string | null
  team_name: string
  opponent: string
  location: string | null
  type: 'domicile' | 'exterieur'
  division: string | null
  result: string | null
  score_for: number | null
  score_against: number | null
  status: 'upcoming' | 'completed' | 'cancelled'
  phase: number | null
  notes: string | null
}

function getDivisionColor(division: string): string {
  if (division.includes('Nationale')) return '#e74c3c'
  if (division.includes('Regionale 1')) return '#f39c12'
  if (division.includes('Regionale 2')) return '#e67e22'
  if (division.includes('Regionale 3')) return '#d35400'
  if (division.includes('Departementale')) return '#3b9fd8'
  return '#3b9fd8'
}

function getDivisionShort(division: string): string {
  if (division.includes('Nationale')) return 'N3'
  if (division.includes('Regionale 1')) return 'R1'
  if (division.includes('Regionale 2')) return 'R2'
  if (division.includes('Regionale 3')) return 'R3'
  if (division.includes('Pre-Regionale')) return 'PR'
  if (division.includes('Departementale 1')) return 'D1'
  if (division.includes('Departementale 2')) return 'D2'
  if (division.includes('Departementale 3')) return 'D3'
  if (division.includes('Departementale 4')) return 'D4'
  return division.substring(0, 3)
}

export default function CompetitionsContent({ competitions }: { competitions: Competition[] }) {
  const [activePhase, setActivePhase] = useState<1 | 2>(2)
  const [teamFilter, setTeamFilter] = useState<string>('all')

  // Filtrer par phase
  const phaseComps = useMemo(
    () => competitions.filter(c => (c.phase || 1) === activePhase),
    [competitions, activePhase]
  )

  // Teams disponibles
  const teams = useMemo(
    () => [...new Set(phaseComps.map(c => c.team_name))].sort(),
    [phaseComps]
  )

  // Filtrer par team
  const filtered = useMemo(
    () => teamFilter === 'all' ? phaseComps : phaseComps.filter(c => c.team_name === teamFilter),
    [phaseComps, teamFilter]
  )

  const aVenir = filtered.filter(c => c.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const passees = filtered.filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Stats
  const p1Comps = competitions.filter(c => (c.phase || 1) === 1 && c.status === 'completed')
  const p2Comps = competitions.filter(c => (c.phase || 1) === 2 && c.status === 'completed')

  const stats = {
    total: filtered.length,
    wins: passees.filter(c => (c.score_for ?? 0) > (c.score_against ?? 0)).length,
    losses: passees.filter(c => (c.score_for ?? 0) < (c.score_against ?? 0)).length,
    draws: passees.filter(c => c.score_for === c.score_against && c.score_for !== null).length,
  }

  // Group results by team
  const resultsByTeam = useMemo(() => {
    const map = new Map<string, Competition[]>()
    for (const comp of passees) {
      const existing = map.get(comp.team_name) || []
      existing.push(comp)
      map.set(comp.team_name, existing)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [passees])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-5">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/" className="hover:text-[#3b9fd8]">Accueil</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Competitions</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <i className="fas fa-calendar-alt mr-3 text-[#3b9fd8]"></i>
              <span className="text-[#3b9fd8]">Calendrier</span> des Competitions
            </h1>
            <p className="text-gray-400 text-lg">
              Toutes les rencontres officielles du TLSTT — Saison 2025/2026
            </p>
          </div>

          {/* Phase Selector */}
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
            <button
              onClick={() => { setActivePhase(1); setTeamFilter('all') }}
              className={`rounded-xl p-4 border-2 transition-all duration-300 text-center ${
                activePhase === 1
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'bg-[#1a1a1a] border-[#333] hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <i className={`fas fa-flag-checkered ${activePhase === 1 ? 'text-amber-400' : 'text-gray-500'}`}></i>
                <span className={`font-bold ${activePhase === 1 ? 'text-amber-400' : 'text-gray-300'}`}>Phase 1</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activePhase === 1 ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-700/50 text-gray-600'
                }`}>Terminee</span>
              </div>
              <p className={`text-xs ${activePhase === 1 ? 'text-amber-300/60' : 'text-gray-600'}`}>
                {p1Comps.length} resultats
              </p>
            </button>

            <button
              onClick={() => { setActivePhase(2); setTeamFilter('all') }}
              className={`rounded-xl p-4 border-2 transition-all duration-300 text-center ${
                activePhase === 2
                  ? 'bg-[#3b9fd8]/10 border-[#3b9fd8] shadow-lg shadow-[#3b9fd8]/10'
                  : 'bg-[#1a1a1a] border-[#333] hover:border-[#3b9fd8]/40'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activePhase === 2 ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activePhase === 2 ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                </span>
                <span className={`font-bold ${activePhase === 2 ? 'text-[#3b9fd8]' : 'text-gray-300'}`}>Phase 2</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  activePhase === 2 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-600'
                }`}>
                  En cours
                </span>
              </div>
              <p className={`text-xs ${activePhase === 2 ? 'text-[#3b9fd8]/60' : 'text-gray-600'}`}>
                {p2Comps.length} resultats
              </p>
            </button>
          </div>

          {/* Team Filter */}
          {teams.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => setTeamFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  teamFilter === 'all'
                    ? 'bg-[#3b9fd8] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:border-[#3b9fd8]/50'
                }`}
              >
                Toutes les equipes
              </button>
              {teams.map(team => (
                <button
                  key={team}
                  onClick={() => setTeamFilter(team)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    teamFilter === team
                      ? 'bg-[#3b9fd8] text-white'
                      : 'bg-[#1a1a1a] text-gray-400 border border-[#333] hover:border-[#3b9fd8]/50'
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#3b9fd8]">{stats.total}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Rencontres</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Victoires</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Defaites</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.draws}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Nuls</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-12">
        {/* Prochaines rencontres */}
        {aVenir.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <i className="fas fa-calendar-alt text-[#3b9fd8]"></i>
              A venir ({aVenir.length})
            </h2>

            <div className="space-y-3">
              {aVenir.map(comp => (
                <div key={comp.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 hover:border-[#3b9fd8]/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#3b9fd8] text-white px-4 py-2 rounded-xl text-center min-w-[70px]">
                        <div className="text-2xl font-bold">{new Date(comp.date).getDate()}</div>
                        <div className="text-xs uppercase">{new Date(comp.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[#3b9fd8] font-bold">{comp.team_name}</span>
                          {comp.division && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                              style={{ backgroundColor: getDivisionColor(comp.division) }}
                            >
                              {getDivisionShort(comp.division)}
                            </span>
                          )}
                        </div>
                        <div className="text-white text-sm">
                          {comp.type === 'domicile' ? (
                            <><span className="text-green-400">TLSTT</span> vs {comp.opponent}</>
                          ) : (
                            <>{comp.opponent} vs <span className="text-green-400">TLSTT</span></>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs flex items-center gap-3 mt-1">
                          {comp.time && <span><i className="fas fa-clock mr-1"></i>{comp.time.slice(0, 5)}</span>}
                          {comp.location && <span><i className="fas fa-map-marker-alt mr-1"></i>{comp.location}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                      comp.type === 'domicile' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      <i className={`fas ${comp.type === 'domicile' ? 'fa-home' : 'fa-car'}`}></i>
                      {comp.type === 'domicile' ? 'Domicile' : 'Exterieur'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultats */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <i className="fas fa-trophy text-[#3b9fd8]"></i>
            Resultats Phase {activePhase} ({passees.length})
          </h2>

          {passees.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-2xl">
              <i className="fas fa-trophy text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-2">Aucun resultat</h3>
              <p className="text-gray-500">
                {activePhase === 2
                  ? 'Les resultats de la Phase 2 apparaitront ici au fur et a mesure des matchs.'
                  : 'Aucun resultat pour cette phase.'
                }
              </p>
            </div>
          ) : teamFilter === 'all' && resultsByTeam.length > 1 ? (
            // Grouped by team
            <div className="space-y-8">
              {resultsByTeam.map(([teamName, comps]) => (
                <div key={teamName}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-white">{teamName}</h3>
                    {comps[0]?.division && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getDivisionColor(comps[0].division) }}
                      >
                        {getDivisionShort(comps[0].division)}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {comps.filter(c => (c.score_for ?? 0) > (c.score_against ?? 0)).length}V — {' '}
                      {comps.filter(c => c.score_for === c.score_against).length}N — {' '}
                      {comps.filter(c => (c.score_for ?? 0) < (c.score_against ?? 0)).length}D
                    </span>
                  </div>
                  <div className="space-y-2">
                    {comps.map(comp => (
                      <MatchRow key={comp.id} comp={comp} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat list
            <div className="space-y-2">
              {passees.map(comp => (
                <MatchRow key={comp.id} comp={comp} showTeam />
              ))}
            </div>
          )}
        </div>

        {/* Link to equipes */}
        <div className="mt-12 text-center">
          <Link href="/equipes" className="inline-flex items-center gap-2 px-6 py-3 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-colors">
            <i className="fas fa-users"></i>
            Voir les classements des equipes
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MATCH ROW COMPONENT
// ============================================
function MatchRow({ comp, showTeam = false }: { comp: Competition; showTeam?: boolean }) {
  const victoire = (comp.score_for ?? 0) > (comp.score_against ?? 0)
  const defaite = (comp.score_for ?? 0) < (comp.score_against ?? 0)
  const nul = comp.score_for === comp.score_against && comp.score_for !== null

  return (
    <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 transition-colors ${
      victoire ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' :
      defaite ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' :
      nul ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40' :
      'bg-[#1a1a1a] border-[#333] hover:border-[#3b9fd8]/40'
    }`}>
      {/* Date */}
      <div className="text-gray-500 text-sm min-w-[100px] shrink-0">
        {new Date(comp.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>

      {/* Team name (optional) */}
      {showTeam && (
        <div className="flex items-center gap-2 min-w-[100px] shrink-0">
          <span className="text-[#3b9fd8] font-semibold text-sm">{comp.team_name}</span>
          {comp.division && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: getDivisionColor(comp.division) }}
            >
              {getDivisionShort(comp.division)}
            </span>
          )}
        </div>
      )}

      {/* Match */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={`${comp.type === 'domicile' ? 'text-green-400' : 'text-gray-400'} font-medium truncate`}>
            {comp.type === 'domicile' ? comp.team_name : comp.opponent}
          </span>
          <span className="text-gray-600 shrink-0">vs</span>
          <span className={`${comp.type !== 'domicile' ? 'text-green-400' : 'text-gray-400'} font-medium truncate`}>
            {comp.type !== 'domicile' ? comp.team_name : comp.opponent}
          </span>
        </div>
        {comp.location && (
          <p className="text-xs text-gray-600 mt-0.5">
            <i className="fas fa-map-marker-alt mr-1"></i>{comp.location}
          </p>
        )}
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          comp.type === 'domicile' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
        }`}>
          <i className={`fas ${comp.type === 'domicile' ? 'fa-home' : 'fa-car'} text-[8px]`}></i>
          {comp.type === 'domicile' ? 'DOM' : 'EXT'}
        </span>

        <div className={`font-bold text-lg px-3 py-1 rounded-lg min-w-[70px] text-center ${
          victoire ? 'bg-green-500/20 text-green-400' :
          defaite ? 'bg-red-500/20 text-red-400' :
          nul ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {comp.result || '-'}
        </div>

        <div className={`text-xs font-bold uppercase px-2 py-1 rounded ${
          victoire ? 'text-green-400' :
          defaite ? 'text-red-400' :
          nul ? 'text-yellow-400' :
          'text-gray-500'
        }`}>
          {victoire ? 'V' : defaite ? 'D' : nul ? 'N' : '-'}
        </div>
      </div>
    </div>
  )
}
