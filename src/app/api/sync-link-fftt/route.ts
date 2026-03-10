import { NextRequest, NextResponse } from 'next/server'
import { SmartPingAPI } from '@/lib/smartping/api'
import { createClient } from '@/lib/supabase/server'

const TLSTT_CLUB_NUMBER = '13830083'

function parseEquipesXml(xml: string): Array<{ libequipe: string; libdivision: string; liendivision: string }> {
  if (!xml || xml.includes('<erreur>')) return []

  const equipes: Array<{ libequipe: string; libdivision: string; liendivision: string }> = []
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

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  try {
    const api = new SmartPingAPI()
    const supabase = await createClient()

    // 1. Récupérer les équipes depuis FFTT (xml_equipe.php?numclu=13830083)
    let equipesXml: string
    try {
      equipesXml = await api.getEquipes(TLSTT_CLUB_NUMBER)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      return NextResponse.json({ error: `Erreur FFTT xml_equipe.php: ${msg}` }, { status: 500 })
    }

    const equipesFFTT = parseEquipesXml(equipesXml)

    if (equipesFFTT.length === 0) {
      return NextResponse.json({
        error: 'Aucune équipe retournée par FFTT',
        rawXml: equipesXml?.substring(0, 500),
      }, { status: 500 })
    }

    // 2. Récupérer les équipes TLSTT depuis Supabase
    const { data: teamsInDb, error: dbError } = await supabase.from('teams').select('id, name')
    if (dbError || !teamsInDb) {
      return NextResponse.json({ error: `Erreur Supabase: ${dbError?.message}` }, { status: 500 })
    }

    // 3. Mettre à jour link_fftt pour chaque équipe
    const updated: Array<{ team: string; D1: string; cx_poule: string }> = []
    const skipped: string[] = []
    const errors: string[] = []

    for (const team of teamsInDb) {
      const teamNumber = team.name.replace(/TLSTT\s*/i, '').trim()
      const teamNumberInt = parseInt(teamNumber, 10)

      if (isNaN(teamNumberInt)) {
        skipped.push(`${team.name}: numéro non numérique ("${teamNumber}")`)
        continue
      }

      const matchingEquipe = equipesFFTT.find((eq) => {
        const ffttNumber = eq.libequipe.replace(/.*?(\d+)\s*$/, '$1').trim()
        return parseInt(ffttNumber, 10) === teamNumberInt
      })

      if (!matchingEquipe || !matchingEquipe.liendivision) {
        skipped.push(
          `${team.name}: pas de correspondance FFTT (cherché n°${teamNumberInt} dans [${equipesFFTT.map((e) => e.libequipe).join(', ')}])`
        )
        continue
      }

      const eqParams = new URLSearchParams(matchingEquipe.liendivision)
      const D1 = eqParams.get('D1') || ''
      const cx_poule = eqParams.get('cx_poule') || ''

      if (!D1 || !cx_poule) {
        skipped.push(`${team.name}: liendivision invalide ("${matchingEquipe.liendivision}")`)
        continue
      }

      const { error: updateError } = await supabase
        .from('teams')
        .update({
          link_fftt: `D1=${D1}&cx_poule=${cx_poule}`,
          division: matchingEquipe.libdivision || undefined,
        })
        .eq('id', team.id)

      if (updateError) {
        errors.push(`${team.name}: ${updateError.message}`)
      } else {
        updated.push({ team: team.name, D1, cx_poule })
      }
    }

    return NextResponse.json({
      success: true,
      updated: updated.length,
      updates: updated,
      skipped,
      errors,
      ffttEquipes: equipesFFTT.map((e) => ({ libequipe: e.libequipe, libdivision: e.libdivision })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
