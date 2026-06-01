import { NextResponse } from 'next/server'
import { smartPingAPI } from '@/lib/smartping/api'
import { createClient } from '@/lib/supabase/server'

const TLSTT_CLUB_NUMBER = '13830083'

interface Competition {
  type: string
  equipe: string
  division: string
  adversaire: string
  domicile: boolean
  datePrevue: string
  dateReelle: string
  scoreA: string
  scoreB: string
  scoreTLSTT: string
  scoreAdverse: string
  joue: boolean
  libelle: string
}

// Fallback : lit la table Supabase `competitions` (alimentée par l'admin / cron sync-equipes)
// quand l'API FFTT SmartPing est indisponible ou renvoie 401 (endpoints non activés pour le compte).
async function supabaseFallback() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .order('date', { ascending: false })

  const rows = data || []
  const map = (r: Record<string, unknown>): Competition => {
    const sf = r.score_for as number | null
    const sa = r.score_against as number | null
    const dom = (r.type as string) === 'domicile'
    const dateStr = (r.date as string) || ''
    return {
      type: 'championnat',
      equipe: (r.team_name as string) || '',
      division: (r.division as string) || '',
      adversaire: (r.opponent as string) || '',
      domicile: dom,
      datePrevue: dateStr,
      dateReelle: dateStr,
      scoreA: dom ? String(sf ?? '') : String(sa ?? ''),
      scoreB: dom ? String(sa ?? '') : String(sf ?? ''),
      scoreTLSTT: String(sf ?? ''),
      scoreAdverse: String(sa ?? ''),
      joue: (r.status as string) === 'completed',
      libelle: (r.notes as string) || '',
    }
  }

  const aVenir = rows.filter(r => r.status === 'upcoming').map(map)
    .sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))
  const passees = rows.filter(r => r.status === 'completed').map(map)

  return NextResponse.json({
    aVenir,
    passees: passees.slice(0, 20),
    total: aVenir.length + passees.length,
    source: 'supabase',
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  })
}

export async function GET() {
  try {
    const equipesXml = await smartPingAPI.getEquipes(TLSTT_CLUB_NUMBER)
    const equipes = parseEquipesXml(equipesXml)

    const allRencontresArrays = await Promise.all(
      equipes.map(async (equipe) => {
        const params = new URLSearchParams(equipe.liendivision)
        const cx_poule = params.get('cx_poule') || ''
        const D1 = params.get('D1') || ''
        if (!D1) return []

        const rencontresXml = await smartPingAPI.getResultatsPoule(D1, cx_poule)
        const rencontres = parseRencontresXml(rencontresXml)

        const tlsttRencontres = rencontres.filter(r =>
          r.equa.toUpperCase().includes('SEYNE') ||
          r.equa.toUpperCase().includes('TLSTT') ||
          r.equb.toUpperCase().includes('SEYNE') ||
          r.equb.toUpperCase().includes('TLSTT')
        )

        return tlsttRencontres.map(renc => {
          const isTLSTTa = renc.equa.toUpperCase().includes('SEYNE') || renc.equa.toUpperCase().includes('TLSTT')
          const adversaire = isTLSTTa ? renc.equb : renc.equa
          return {
            type: 'championnat',
            equipe: equipe.libequipe,
            division: equipe.libdivision,
            adversaire,
            domicile: isTLSTTa,
            datePrevue: renc.dateprevue,
            dateReelle: renc.datereelle,
            scoreA: renc.scorea,
            scoreB: renc.scoreb,
            scoreTLSTT: isTLSTTa ? renc.scorea : renc.scoreb,
            scoreAdverse: isTLSTTa ? renc.scoreb : renc.scorea,
            joue: !!(renc.scorea && renc.scoreb),
            libelle: renc.libelle,
          }
        })
      })
    )

    const allCompetitions = allRencontresArrays.flat()

    // Aucune donnée FFTT (compte non activé pour ces endpoints) -> fallback Supabase
    if (allCompetitions.length === 0) {
      return supabaseFallback()
    }

    allCompetitions.sort((a, b) => {
      const dateA = parseFrenchDate(a.datePrevue || a.dateReelle)
      const dateB = parseFrenchDate(b.datePrevue || b.dateReelle)
      return dateA.localeCompare(dateB)
    })

    const today = new Date().toISOString().split('T')[0]
    const passees = allCompetitions.filter(c => {
      const date = parseFrenchDate(c.datePrevue || c.dateReelle)
      return date < today || c.joue
    }).reverse()
    const aVenir = allCompetitions.filter(c => {
      const date = parseFrenchDate(c.datePrevue || c.dateReelle)
      return date >= today && !c.joue
    })

    return NextResponse.json({
      aVenir,
      passees: passees.slice(0, 20),
      total: allCompetitions.length,
      source: 'api',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch (error: unknown) {
    // FFTT KO -> on tente le fallback Supabase avant d'abandonner
    try {
      return await supabaseFallback()
    } catch {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      console.warn('Erreur API competitions:', message)
      return NextResponse.json({ aVenir: [], passees: [], total: 0, source: 'unavailable', error: message })
    }
  }
}

function parseEquipesXml(xml: string): { libequipe: string; libdivision: string; liendivision: string }[] {
  if (!xml || xml.includes('<erreur>')) return []
  const equipes: { libequipe: string; libdivision: string; liendivision: string }[] = []
  const matches = xml.matchAll(/<equipe>([\s\S]*?)<\/equipe>/g)
  for (const match of matches) {
    const equipeXml = match[1]
    const getValue = (tag: string): string => {
      const m = equipeXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }
    equipes.push({
      libequipe: getValue('libequipe'),
      libdivision: getValue('libdivision'),
      liendivision: getValue('liendivision'),
    })
  }
  return equipes
}

function parseRencontresXml(xml: string): { libelle: string; equa: string; equb: string; scorea: string; scoreb: string; dateprevue: string; datereelle: string }[] {
  if (!xml || xml.includes('<erreur>')) return []
  const rencontres: { libelle: string; equa: string; equb: string; scorea: string; scoreb: string; dateprevue: string; datereelle: string }[] = []
  const matches = xml.matchAll(/<tour>([\s\S]*?)<\/tour>/g)
  for (const match of matches) {
    const tourXml = match[1]
    const getValue = (tag: string): string => {
      const m = tourXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }
    rencontres.push({
      libelle: getValue('libelle'),
      equa: getValue('equa'),
      equb: getValue('equb'),
      scorea: getValue('scorea'),
      scoreb: getValue('scoreb'),
      dateprevue: getValue('dateprevue'),
      datereelle: getValue('datereelle'),
    })
  }
  return rencontres
}

function parseFrenchDate(dateStr: string): string {
  if (!dateStr) return '9999-12-31'
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${year}-${month}-${day}`
  }
  return dateStr
}
