import { NextResponse } from 'next/server'
import { smartPingAPI } from '@/lib/smartping/api'

const TLSTT_CLUB_NUMBER = '13830083'

export async function GET() {
  try {
    // 1. Récupérer les équipes du club TLSTT pour avoir leurs poules
    const equipesXml = await smartPingAPI.getEquipes(TLSTT_CLUB_NUMBER)
    const equipes = parseEquipesXml(equipesXml)

    // 2. Pour chaque équipe, récupérer les rencontres — en parallèle
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
          const domicile = isTLSTTa

          return {
            type: 'championnat',
            equipe: equipe.libequipe,
            division: equipe.libdivision,
            adversaire,
            domicile,
            datePrevue: renc.dateprevue,
            dateReelle: renc.datereelle,
            scoreA: renc.scorea,
            scoreB: renc.scoreb,
            scoreTLSTT: isTLSTTa ? renc.scorea : renc.scoreb,
            scoreAdverse: isTLSTTa ? renc.scoreb : renc.scorea,
            joue: !!(renc.scorea && renc.scoreb),
            libelle: renc.libelle
          }
        })
      })
    )

    const allCompetitions = allRencontresArrays.flat()

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
      source: 'api'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur API competitions:', message)
    return NextResponse.json({
      aVenir: [],
      passees: [],
      total: 0,
      source: 'unavailable',
      error: message
    })
  }
}

function parseEquipesXml(xml: string): any[] {
  if (!xml || xml.includes('<erreur>')) return []

  const equipes: any[] = []
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
      idepr: getValue('idepr'),
      libepr: getValue('libepr')
    })
  }

  return equipes
}

function parseRencontresXml(xml: string): any[] {
  if (!xml || xml.includes('<erreur>')) return []

  const rencontres: any[] = []
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
      lien: getValue('lien')
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
