import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SmartPingAPI } from '@/lib/smartping/api'

const TLSTT_CLUB_NUMBER = '13830083'

interface TeamSyncResult {
  team: string
  status: 'updated' | 'not_found' | 'error' | 'no_classement'
  division?: string
  pool?: string
  cla?: number
  joue?: number
  pts?: number
  vic?: number
  def?: number
  nul?: number
  error?: string
}

interface ClassementEntry {
  clt: string
  equipe: string
  joue: string
  pts: string
  numero: string
  vic: string
  def: string
  nul: string
}

function parseEquipesXml(xml: string): Array<{
  libequipe: string
  libdivision: string
  liendivision: string
  idepr: string
  libepr: string
}> {
  if (!xml || xml.includes('<erreur>')) return []

  const equipes: Array<{
    libequipe: string
    libdivision: string
    liendivision: string
    idepr: string
    libepr: string
  }> = []
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
      libepr: getValue('libepr'),
    })
  }

  return equipes
}

function parseClassementXml(xml: string): ClassementEntry[] {
  if (!xml || xml.includes('<erreur>')) return []

  const classements: ClassementEntry[] = []
  const matches = xml.matchAll(/<classement>([\s\S]*?)<\/classement>/g)

  for (const match of matches) {
    const clXml = match[1]
    const getValue = (tag: string): string => {
      const m = clXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }

    classements.push({
      clt: getValue('clt'),
      equipe: getValue('equipe'),
      joue: getValue('joue'),
      pts: getValue('pts'),
      numero: getValue('numero'),
      vic: getValue('vic'),
      def: getValue('def'),
      nul: getValue('nul'),
    })
  }

  return classements
}

export async function GET() {
  const supabase = await createClient()
  const api = new SmartPingAPI()
  const results: TeamSyncResult[] = []
  const errors: string[] = []

  try {
    // ═══════════════════════════════════════════
    // 1. RECUPERER LES EQUIPES DEPUIS L'API FFTT
    // ═══════════════════════════════════════════
    let equipesXml: string
    try {
      equipesXml = await api.getEquipes(TLSTT_CLUB_NUMBER)
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: `Impossible de recuperer les equipes FFTT: ${e.message}`,
        timestamp: new Date().toISOString(),
      })
    }

    const equipesFFTT = parseEquipesXml(equipesXml)

    if (equipesFFTT.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucune equipe trouvee dans la reponse FFTT',
        xmlPreview: equipesXml.substring(0, 500),
        timestamp: new Date().toISOString(),
      })
    }

    // ═══════════════════════════════════════════
    // 2. POUR CHAQUE EQUIPE, RECUPERER LE CLASSEMENT
    // ═══════════════════════════════════════════
    for (const equipe of equipesFFTT) {
      const params = new URLSearchParams(equipe.liendivision)
      const D1 = params.get('D1') || ''
      const cx_poule = params.get('cx_poule') || ''

      // Extraire le numero d'equipe (ex: "TOULON LA SEYNE TT 2" -> "2")
      const numMatch = equipe.libequipe.match(/(\d+)\s*$/)
      const teamNumber = numMatch ? numMatch[1] : '1'
      const tlsttName = `TLSTT ${teamNumber}`

      if (!D1 || !cx_poule) {
        results.push({
          team: tlsttName,
          status: 'error',
          division: equipe.libdivision,
          error: 'Parametres D1/cx_poule manquants',
        })
        continue
      }

      // Extraire le nom de la poule depuis liendivision ou libdivision
      const poolMatch = equipe.libdivision.match(/Poule\s*(\w+)/i)
      const pool = poolMatch ? poolMatch[1] : cx_poule

      // Recuperer le classement de la poule
      let classement: ClassementEntry[] = []
      try {
        const classementXml = await api.getClassementPoule(D1, cx_poule)
        classement = parseClassementXml(classementXml)
      } catch (e: any) {
        errors.push(`Classement ${tlsttName}: ${e.message}`)
        results.push({
          team: tlsttName,
          status: 'error',
          division: equipe.libdivision,
          error: `Erreur classement: ${e.message}`,
        })
        continue
      }

      // Trouver TLSTT dans le classement
      const tlsttEntry = classement.find((c) => c.numero === TLSTT_CLUB_NUMBER)

      if (!tlsttEntry) {
        // L'equipe n'est pas dans le classement (possible si nouvelle equipe Phase 2)
        results.push({
          team: tlsttName,
          status: 'no_classement',
          division: equipe.libdivision,
          pool,
        })

        // Mettre a jour au moins la division et le pool dans Supabase
        await supabase
          .from('teams')
          .update({
            division: equipe.libdivision,
            pool: pool,
            phase: 2,
            link_fftt: `Phase 2 - ${equipe.libdivision}`,
          })
          .ilike('name', tlsttName)

        continue
      }

      // Mettre a jour Supabase avec les donnees FFTT
      const updateData = {
        division: equipe.libdivision,
        pool: pool,
        phase: 2,
        cla: parseInt(tlsttEntry.clt) || 0,
        joue: parseInt(tlsttEntry.joue) || 0,
        pts: parseInt(tlsttEntry.pts) || 0,
        vic: parseInt(tlsttEntry.vic) || 0,
        def: parseInt(tlsttEntry.def) || 0,
        nul: parseInt(tlsttEntry.nul) || 0,
        link_fftt: `Phase 2 - ${equipe.libdivision} - ${tlsttEntry.clt}e`,
        is_active: true,
      }

      const { error: updateError } = await supabase
        .from('teams')
        .update(updateData)
        .ilike('name', tlsttName)

      if (updateError) {
        results.push({
          team: tlsttName,
          status: 'error',
          division: equipe.libdivision,
          error: `Erreur Supabase: ${updateError.message}`,
        })
      } else {
        results.push({
          team: tlsttName,
          status: 'updated',
          division: equipe.libdivision,
          pool,
          cla: parseInt(tlsttEntry.clt) || 0,
          joue: parseInt(tlsttEntry.joue) || 0,
          pts: parseInt(tlsttEntry.pts) || 0,
          vic: parseInt(tlsttEntry.vic) || 0,
          def: parseInt(tlsttEntry.def) || 0,
          nul: parseInt(tlsttEntry.nul) || 0,
        })
      }

      // Petit delai pour eviter de surcharger l'API FFTT
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // ═══════════════════════════════════════════
    // 3. RESUME
    // ═══════════════════════════════════════════
    const updated = results.filter((r) => r.status === 'updated')
    const notFound = results.filter((r) => r.status === 'no_classement')
    const errored = results.filter((r) => r.status === 'error')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'API FFTT SmartPing',
      clubNumber: TLSTT_CLUB_NUMBER,
      summary: {
        totalEquipesFFTT: equipesFFTT.length,
        updated: updated.length,
        noClassement: notFound.length,
        errors: errored.length,
      },
      results,
      fetchErrors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Erreur sync-equipes:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
