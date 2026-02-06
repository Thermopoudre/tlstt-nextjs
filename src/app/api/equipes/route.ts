import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Numéro du club TLSTT Toulon La Seyne
const TLSTT_CLUB_NUMBER = '13830083'

// Ordre de tri des divisions (du plus haut au plus bas niveau)
const DIVISION_ORDER: Record<string, number> = {
  'Nationale 3': 1,
  'Pre-Nationale': 2,
  'Regionale 1': 3,
  'Regionale 2': 4,
  'Regionale 3': 5,
  'Pre-Regionale': 6,
  'Departementale 1': 7,
  'Departementale 2': 8,
  'Departementale 3': 9,
  'Departementale 4': 10,
  'Departementale 4 Jeunes': 11,
}

function getDivisionOrder(division: string): number {
  return DIVISION_ORDER[division] || 99
}

export async function GET() {
  const supabase = await createClient()

  try {
    // Recuperer les equipes depuis Supabase
    const { data: teamsFromDb, error: dbError } = await supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)

    if (dbError) {
      console.error('Erreur lecture teams Supabase:', dbError)
      return NextResponse.json({
        equipes: [],
        error: 'Erreur lecture base de donnees',
        timestamp: new Date().toISOString()
      })
    }

    if (!teamsFromDb || teamsFromDb.length === 0) {
      return NextResponse.json({
        equipes: [],
        source: 'Aucune donnee',
        clubNumber: TLSTT_CLUB_NUMBER,
        timestamp: new Date().toISOString()
      })
    }

    // Trier par niveau de division puis par nom
    const sortedTeams = teamsFromDb.sort((a, b) => {
      const orderA = getDivisionOrder(a.division || '')
      const orderB = getDivisionOrder(b.division || '')
      if (orderA !== orderB) return orderA - orderB
      return (a.name || '').localeCompare(b.name || '')
    })

    // Formater pour le frontend
    const equipes = sortedTeams.map(t => ({
      id: t.id,
      libequipe: t.name,
      libepr: t.division || '',
      libdivision: t.division || '',
      pool: t.pool || '',
      phase: t.phase || 2,
      cla: t.cla || 0,
      joue: t.joue || 0,
      pts: t.pts || 0,
      vic: t.vic || 0,
      def: t.def || 0,
      nul: t.nul || 0,
      link_fftt: t.link_fftt || '',
    }))

    return NextResponse.json({
      equipes,
      clubNumber: TLSTT_CLUB_NUMBER,
      source: 'Base de donnees',
      totalEquipes: equipes.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur API equipes:', message)
    return NextResponse.json({
      equipes: [],
      error: message
    })
  }
}
