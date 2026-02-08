import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Divisions Phase 2 officielles (source: PDF ligue PACA 2526_equipes_paca_ph2.pdf)
const PHASE2_DIVISIONS = [
  { name: 'TLSTT 1', division: 'Nationale 3', pool: '7', link_fftt: 'Phase 1: Nationale 3' },
  { name: 'TLSTT 2', division: 'Regionale 1', pool: '2', link_fftt: 'Phase 1: Regionale 2 Poule 2 (1er - Promu R1)' },
  { name: 'TLSTT 3', division: 'Regionale 3', pool: '2', link_fftt: 'Phase 1: Regionale 2 Poule 1 (7e - Relegue R3)' },
  { name: 'TLSTT 4', division: 'Regionale 3', pool: '6', link_fftt: 'Phase 1: Regionale 3 Poule 2 (6e)' },
  { name: 'TLSTT 5', division: 'Pre-Regionale', pool: '2', link_fftt: 'Phase 1: Pre-Regionale Poule 1' },
  { name: 'TLSTT 6', division: 'Departementale 1', pool: '1', link_fftt: 'Phase 1: Pre-Regionale Poule 2' },
  { name: 'TLSTT 7', division: 'Departementale 1', pool: '2', link_fftt: 'Phase 1: Departementale 1 Poule 1' },
  { name: 'TLSTT 8', division: 'Departementale 2', pool: '1', link_fftt: 'Phase 1: Departementale 2 Poule 4' },
  { name: 'TLSTT 9', division: 'Departementale 3', pool: '4', link_fftt: 'Phase 1: Departementale 2 Poule 1' },
  { name: 'TLSTT 10', division: 'Departementale 3', pool: '6', link_fftt: 'Phase 1: Departementale 3 Poule 4' },
  { name: 'TLSTT 11', division: 'Departementale 3', pool: '1', link_fftt: 'Phase 1: Departementale 3 Poule 2 (1er)' },
  { name: 'TLSTT 12', division: 'Departementale 4 Jeunes', pool: '1', link_fftt: 'Phase 1: Departementale 4 Poule 2 Jeunes' },
  { name: 'TLSTT 13', division: 'Departementale 4 Jeunes', pool: '1', link_fftt: 'Nouvelle equipe Phase 2' },
]

export async function GET() {
  const supabase = await createClient()
  const results: { name: string; status: string; error?: string }[] = []

  try {
    for (const team of PHASE2_DIVISIONS) {
      const { error } = await supabase
        .from('teams')
        .update({
          division: team.division,
          pool: team.pool,
          phase: 2,
          cla: 0,
          joue: 0,
          pts: 0,
          vic: 0,
          def: 0,
          nul: 0,
          link_fftt: team.link_fftt,
        })
        .ilike('name', team.name)

      if (error) {
        results.push({ name: team.name, status: 'error', error: error.message })
      } else {
        results.push({ name: team.name, status: 'updated' })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Divisions Phase 2 mises a jour, stats remises a zero',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ success: false, error: message })
  }
}