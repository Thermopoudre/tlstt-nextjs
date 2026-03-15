import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smartPingAPI } from '@/lib/smartping/api'

const CLUB_ID = '13830083'

// ============================================
// PARSING HELPERS
// ============================================

function extractXmlValue(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return m ? m[1].trim() : null
}

function parseFrenchDate(dateStr: string): string {
  if (!dateStr) return '9999-12-31'
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return dateStr
}

// Match FFTT team name → local TLSTT name
// "TOULON LA SEYNE 3" → "TLSTT 3"
function getLocalTeamName(libequipe: string): string | null {
  const m = libequipe.match(/TOULON\s+LA\s+SEYNE\s+(\d+)/i)
  return m ? `TLSTT ${m[1]}` : null
}

interface EquipeFFTT {
  libequipe: string
  libdivision: string
  liendivision: string // "cx_poule=5&D1=12345"
}

// Parse xml_equipe.php response
function parseEquipesXml(xml: string): EquipeFFTT[] {
  const blocks = xml.match(/<equipe>[\s\S]*?<\/equipe>/g) || []
  return blocks.map(chunk => ({
    libequipe: extractXmlValue(chunk, 'libequipe') || '',
    libdivision: extractXmlValue(chunk, 'libdivision') || '',
    liendivision: extractXmlValue(chunk, 'liendivision') || '',
  })).filter(e => e.libequipe)
}

interface TeamStats {
  cla: number
  joue: number
  vic: number
  def: number
  nul: number
  pts: number
}

// Parse xml_result_equ.php?action=classement
// Find the row matching the given FFTT team name
function parseClassementXml(xml: string, libequipe: string): TeamStats | null {
  const blocks = xml.match(/<classement>[\s\S]*?<\/classement>/g) || []
  const target = libequipe.toLowerCase().trim()
  for (const chunk of blocks) {
    const equipe = (extractXmlValue(chunk, 'equipe') || '').toLowerCase().trim()
    if (equipe === target) {
      return {
        cla: parseInt(extractXmlValue(chunk, 'clt') || '0') || 0,
        joue: parseInt(extractXmlValue(chunk, 'joue') || '0') || 0,
        vic: parseInt(extractXmlValue(chunk, 'gagner') || '0') || 0,
        def: parseInt(extractXmlValue(chunk, 'perdre') || '0') || 0,
        nul: parseInt(extractXmlValue(chunk, 'nul') || '0') || 0,
        pts: parseInt(extractXmlValue(chunk, 'pts') || '0') || 0,
      }
    }
  }
  return null
}

interface Rencontre {
  date: string        // YYYY-MM-DD
  equA: string
  equB: string
  resA: number | null
  resB: number | null
  lienDiv: string
}

// Parse xml_result_equ.php (without action=classement)
function parseResultatsXml(xml: string): Rencontre[] {
  const blocks = xml.match(/<resultat>[\s\S]*?<\/resultat>/g) || []
  return blocks.map(chunk => {
    const dateEffective = extractXmlValue(chunk, 'dateeffective')
    const datePrevue = extractXmlValue(chunk, 'dateprevue')
    const dateStr = (dateEffective && dateEffective.trim() && dateEffective !== '00/00/0000')
      ? dateEffective
      : (datePrevue || '')

    const resAStr = extractXmlValue(chunk, 'resa')
    const resBStr = extractXmlValue(chunk, 'resb')
    const resA = resAStr && !isNaN(parseInt(resAStr)) ? parseInt(resAStr) : null
    const resB = resBStr && !isNaN(parseInt(resBStr)) ? parseInt(resBStr) : null

    return {
      date: parseFrenchDate(dateStr),
      equA: extractXmlValue(chunk, 'equa') || '',
      equB: extractXmlValue(chunk, 'equb') || '',
      resA,
      resB,
      lienDiv: extractXmlValue(chunk, 'libdiv') || '',
    }
  }).filter(r => r.equA && r.equB)
}

// ============================================
// MAIN SYNC HANDLER
// ============================================
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const results: { team: string; status: string; stats?: TeamStats; error?: string }[] = []
  let matchesInserted = 0
  let matchesUpdated = 0

  try {
    // ============================================
    // 1. RÉCUPÉRER LES ÉQUIPES VIA SMARTPING
    // ============================================
    const equipesXml = await smartPingAPI.getEquipes(CLUB_ID)

    if (!equipesXml || equipesXml.includes('<erreur>')) {
      const errMsg = extractXmlValue(equipesXml || '', 'erreur') || 'Réponse invalide'
      return NextResponse.json({
        success: false,
        error: `SmartPing getEquipes: ${errMsg}`,
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }

    const allEquipes = parseEquipesXml(equipesXml)
    // Filter only TLSTT teams
    const tlsttEquipes = allEquipes.filter(e => /TOULON\s+LA\s+SEYNE/i.test(e.libequipe))

    if (tlsttEquipes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucune équipe TOULON LA SEYNE trouvée dans SmartPing',
        timestamp: new Date().toISOString(),
      }, { status: 404 })
    }

    // ============================================
    // 2. POUR CHAQUE ÉQUIPE: classement + rencontres EN PARALLÈLE
    // ============================================
    const teamDataList = await Promise.all(
      tlsttEquipes.map(async (equipe) => {
        const localName = getLocalTeamName(equipe.libequipe)
        if (!localName) return null

        // Parse D1 and cx_poule from liendivision
        let D1 = ''
        let cx_poule = ''
        try {
          const params = new URLSearchParams(equipe.liendivision)
          D1 = params.get('D1') || ''
          cx_poule = params.get('cx_poule') || ''
        } catch {
          // liendivision may not be URL-encoded properly
          const d1Match = equipe.liendivision.match(/D1=(\d+)/i)
          const cpMatch = equipe.liendivision.match(/cx_poule=(\d+)/i)
          D1 = d1Match?.[1] || ''
          cx_poule = cpMatch?.[1] || ''
        }

        if (!D1 || !cx_poule) {
          return { localName, equipe, classement: null, rencontres: [], D1, cx_poule }
        }

        try {
          const [classementXml, rencontresXml] = await Promise.all([
            smartPingAPI.getClassementPoule(D1, cx_poule),
            smartPingAPI.getResultatsPoule(D1, cx_poule),
          ])

          const classement = parseClassementXml(classementXml, equipe.libequipe)
          const rencontres = parseResultatsXml(rencontresXml)

          return { localName, equipe, classement, rencontres, D1, cx_poule }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue'
          return { localName, equipe, classement: null, rencontres: [], D1, cx_poule, error: msg }
        }
      })
    )

    // ============================================
    // 3. METTRE À JOUR SUPABASE — teams
    // ============================================
    for (const td of teamDataList) {
      if (!td) continue

      if (td.error) {
        results.push({ team: td.localName, status: 'error', error: td.error })
        continue
      }

      if (!td.classement || td.classement.joue === 0) {
        results.push({
          team: td.localName,
          status: 'no_data',
          error: `Pas de données de classement pour ${td.equipe.libequipe}`,
        })
        continue
      }

      const { error: updateError } = await supabase
        .from('teams')
        .update({
          cla: td.classement.cla,
          joue: td.classement.joue,
          pts: td.classement.pts,
          vic: td.classement.vic,
          def: td.classement.def,
          nul: td.classement.nul,
          division: td.equipe.libdivision || undefined,
          // Ne PAS écraser link_fftt — mis à jour par /api/discover-equipes uniquement
          updated_at: new Date().toISOString(),
        })
        .ilike('name', td.localName)

      if (updateError) {
        results.push({ team: td.localName, status: 'error', error: updateError.message })
      } else {
        results.push({ team: td.localName, status: 'updated', stats: td.classement })
      }

      // ============================================
      // 4. METTRE À JOUR competitions (matchs joués)
      // ============================================
      for (const rencontre of td.rencontres) {
        // Only sync completed matches (both scores present)
        if (rencontre.resA === null || rencontre.resB === null) continue
        if (!rencontre.date || rencontre.date === '9999-12-31') continue

        const isTLSTT_A = /TOULON\s+LA\s+SEYNE/i.test(rencontre.equA) ||
                          /TLSTT/i.test(rencontre.equA)
        const opponent = isTLSTT_A ? rencontre.equB : rencontre.equA
        const scoreFor = isTLSTT_A ? rencontre.resA : rencontre.resB
        const scoreAgainst = isTLSTT_A ? rencontre.resB : rencontre.resA
        const matchType = isTLSTT_A ? 'domicile' : 'exterieur'
        const location = isTLSTT_A ? 'Gymnase Léo Lagrange' : 'Extérieur'

        // Upsert: chercher si le match existe déjà
        const { data: existing } = await supabase
          .from('competitions')
          .select('id')
          .eq('date', rencontre.date)
          .eq('team_name', td.localName)
          .eq('opponent', opponent)
          .limit(1)

        if (existing && existing.length > 0) {
          await supabase
            .from('competitions')
            .update({
              score_for: scoreFor,
              score_against: scoreAgainst,
              result: `${scoreFor}-${scoreAgainst}`,
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing[0].id)
          matchesUpdated++
        } else {
          const { error: insertError } = await supabase
            .from('competitions')
            .insert({
              date: rencontre.date,
              time: '14:00',
              team_name: td.localName,
              opponent,
              location,
              type: matchType,
              division: td.equipe.libdivision || '',
              score_for: scoreFor,
              score_against: scoreAgainst,
              result: `${scoreFor}-${scoreAgainst}`,
              status: 'completed',
            })
          if (!insertError) matchesInserted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'SmartPing API (xml_equipe + xml_result_equ)',
      summary: {
        equipesFFTT: tlsttEquipes.length,
        total: results.length,
        updated: results.filter(r => r.status === 'updated').length,
        noData: results.filter(r => r.status === 'no_data').length,
        errors: results.filter(r => r.status === 'error').length,
        matchesInserted,
        matchesUpdated,
      },
      results,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur sync-equipes:', message)
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
