import { NextResponse } from 'next/server'
import { SmartPingAPI } from '@/lib/smartping/api'
import { createClient } from '@/lib/supabase/server'

const TLSTT_CLUB_NUMBER = '13830083'

interface DiscoveredTeam {
  equipe: string
  division: string
  D1: string
  cx_poule: string
  clt: string
  pts: string
  joue: string
  vic: string
  def: string
  nul: string
}

function parseOrganismesXml(xml: string): Array<{ id: string; libelle: string; code: string }> {
  if (!xml || xml.includes('<erreur>')) return []
  const items: Array<{ id: string; libelle: string; code: string }> = []
  const matches = xml.matchAll(/<organisme>([\s\S]*?)<\/organisme>/g)
  for (const match of matches) {
    const x = match[1]
    const getValue = (tag: string) => x.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] || ''
    items.push({ id: getValue('id'), libelle: getValue('libelle'), code: getValue('code') })
  }
  return items
}

function parseEpreuvesXml(xml: string): Array<{ idepreuve: string; libelle: string; typepreuve: string }> {
  if (!xml || xml.includes('<erreur>')) return []
  const items: Array<{ idepreuve: string; libelle: string; typepreuve: string }> = []
  const matches = xml.matchAll(/<epreuve>([\s\S]*?)<\/epreuve>/g)
  for (const match of matches) {
    const x = match[1]
    const getValue = (tag: string) => x.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] || ''
    items.push({ idepreuve: getValue('idepreuve'), libelle: getValue('libelle'), typepreuve: getValue('typepreuve') })
  }
  return items
}

function parseDivisionsXml(xml: string): Array<{ iddivision: string; libelle: string }> {
  if (!xml || xml.includes('<erreur>')) return []
  const items: Array<{ iddivision: string; libelle: string }> = []
  const matches = xml.matchAll(/<division>([\s\S]*?)<\/division>/g)
  for (const match of matches) {
    const x = match[1]
    const getValue = (tag: string) => x.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] || ''
    items.push({ iddivision: getValue('iddivision'), libelle: getValue('libelle') })
  }
  return items
}

function parseClassementXml(xml: string): Array<{
  clt: string; equipe: string; joue: string; pts: string; numero: string; vic: string; def: string; nul: string
}> {
  if (!xml || xml.includes('<erreur>')) return []
  const items: Array<{ clt: string; equipe: string; joue: string; pts: string; numero: string; vic: string; def: string; nul: string }> = []
  const matches = xml.matchAll(/<classement>([\s\S]*?)<\/classement>/g)
  for (const match of matches) {
    const x = match[1]
    const getValue = (tag: string) => x.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] || ''
    items.push({
      clt: getValue('clt'), equipe: getValue('equipe'), joue: getValue('joue'),
      pts: getValue('pts'), numero: getValue('numero'), vic: getValue('vic'),
      def: getValue('def'), nul: getValue('nul'),
    })
  }
  return items
}

function parsePoulesXml(xml: string): Array<{ lien: string; libelle: string }> {
  if (!xml || xml.includes('<erreur>')) return []
  const items: Array<{ lien: string; libelle: string }> = []
  const matches = xml.matchAll(/<poule>([\s\S]*?)<\/poule>/g)
  for (const match of matches) {
    const x = match[1]
    const getValue = (tag: string) => x.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] || ''
    items.push({ lien: getValue('lien'), libelle: getValue('libelle') })
  }
  return items
}

export async function GET() {
  const api = new SmartPingAPI()
  const discovered: DiscoveredTeam[] = []
  const logs: string[] = []
  const errors: string[] = []

  try {
    // ═══════════════════════════════════════
    // ETAPE 1: Trouver les organismes
    // ═══════════════════════════════════════
    // Département Var = code D83, mais on a besoin de l'ID
    // Ligue PACA pour les divisions régionales

    // Chercher les ligues (type L)
    logs.push('Recherche des ligues...')
    let ligueId = ''
    let departementId = ''

    try {
      const liguesXml = await api.getOrganismes('L')
      const ligues = parseOrganismesXml(liguesXml)
      logs.push(`${ligues.length} ligues trouvees`)

      // Chercher PACA / Provence / Cote d'Azur / Region Sud
      const paca = ligues.find(l =>
        l.libelle.toUpperCase().includes('PACA') ||
        l.libelle.toUpperCase().includes('PROVENCE') ||
        l.libelle.toUpperCase().includes('SUD') ||
        l.code.includes('L13') || l.code.includes('L83')
      )

      if (paca) {
        ligueId = paca.id
        logs.push(`Ligue trouvee: ${paca.libelle} (ID: ${paca.id}, code: ${paca.code})`)
      } else {
        // Lister toutes les ligues pour diagnostic
        logs.push(`Ligues disponibles: ${ligues.map(l => `${l.libelle} (${l.code})`).join(', ')}`)
      }
    } catch (e: any) {
      errors.push(`Erreur ligues: ${e.message}`)
    }

    // Chercher le département Var (type D)
    try {
      const deptsXml = await api.getOrganismes('D', ligueId || undefined)
      const depts = parseOrganismesXml(deptsXml)
      logs.push(`${depts.length} departements trouves`)

      const varDept = depts.find(d =>
        d.code === 'D83' || d.libelle.toUpperCase().includes('VAR')
      )

      if (varDept) {
        departementId = varDept.id
        logs.push(`Departement Var trouve: ${varDept.libelle} (ID: ${varDept.id})`)
      } else {
        logs.push(`Departements: ${depts.slice(0, 20).map(d => `${d.libelle} (${d.code})`).join(', ')}`)
      }
    } catch (e: any) {
      errors.push(`Erreur departements: ${e.message}`)
    }

    // ═══════════════════════════════════════
    // ETAPE 2: Chercher les epreuves (competitions par equipes)
    // ═══════════════════════════════════════
    const organismeIds = [departementId, ligueId].filter(Boolean)

    for (const orgId of organismeIds) {
      logs.push(`Recherche epreuves pour organisme ${orgId}...`)

      try {
        const epreuvesXml = await api.getEpreuves(orgId, 'E')
        const epreuves = parseEpreuvesXml(epreuvesXml)
        logs.push(`${epreuves.length} epreuves trouvees pour org ${orgId}`)

        for (const epreuve of epreuves) {
          logs.push(`  Epreuve: ${epreuve.libelle} (${epreuve.idepreuve})`)

          // ═══════════════════════════════════════
          // ETAPE 3: Chercher les divisions de chaque epreuve
          // ═══════════════════════════════════════
          try {
            const divsXml = await api.getDivisions(orgId, epreuve.idepreuve, 'E')
            const divisions = parseDivisionsXml(divsXml)
            logs.push(`    ${divisions.length} divisions trouvees`)

            for (const division of divisions) {
              // ═══════════════════════════════════════
              // ETAPE 4: Pour chaque division, chercher les poules
              // ═══════════════════════════════════════
              try {
                // D'abord récupérer les poules de cette division
                const poulesXml = await api.request_public('xml_result_equ.php', {
                  action: 'poule', auto: '1', D1: division.iddivision
                })
                const poules = parsePoulesXml(poulesXml)

                for (const poule of poules) {
                  // Extraire cx_poule du lien
                  const params = new URLSearchParams(poule.lien)
                  const cx_poule = params.get('cx_poule') || ''

                  if (!cx_poule) continue

                  // Vérifier si TLSTT est dans le classement de cette poule
                  try {
                    const classXml = await api.getClassementPoule(division.iddivision, cx_poule)
                    const classement = parseClassementXml(classXml)

                    const tlsttEntry = classement.find(c => c.numero === TLSTT_CLUB_NUMBER)
                    if (tlsttEntry) {
                      discovered.push({
                        equipe: tlsttEntry.equipe,
                        division: `${epreuve.libelle} - ${division.libelle}`,
                        D1: division.iddivision,
                        cx_poule,
                        clt: tlsttEntry.clt,
                        pts: tlsttEntry.pts,
                        joue: tlsttEntry.joue,
                        vic: tlsttEntry.vic,
                        def: tlsttEntry.def,
                        nul: tlsttEntry.nul,
                      })
                      logs.push(`    ✅ TLSTT TROUVEE: ${tlsttEntry.equipe} dans ${division.libelle} (D1=${division.iddivision}, cx_poule=${cx_poule})`)
                    }
                  } catch {
                    // Silently skip classement errors
                  }

                  // Petit delai pour ne pas surcharger l'API
                  await new Promise(r => setTimeout(r, 100))
                }
              } catch {
                // Skip if poule retrieval fails
              }

              await new Promise(r => setTimeout(r, 100))
            }
          } catch (e: any) {
            errors.push(`Erreur divisions epreuve ${epreuve.idepreuve}: ${e.message}`)
          }

          await new Promise(r => setTimeout(r, 200))
        }
      } catch (e: any) {
        errors.push(`Erreur epreuves org ${orgId}: ${e.message}`)
      }
    }

    // ═══════════════════════════════════════
    // ETAPE 5: Mettre à jour Supabase si des equipes trouvees
    // ═══════════════════════════════════════
    let supabaseUpdates = 0
    if (discovered.length > 0) {
      try {
        const supabase = await createClient()

        for (const team of discovered) {
          // Extraire le numéro d'équipe (ex: "TOULON LA SEYNE TT 2" -> "2")
          const numMatch = team.equipe.match(/(\d+)\s*$/)
          const teamNumber = numMatch ? numMatch[1] : '1'
          const tlsttName = `TLSTT ${teamNumber}`

          // Extraire le pool number du division libelle
          const poolMatch = team.division.match(/[Pp]oule\s*(\w+)/i)
          const pool = poolMatch ? poolMatch[1] : ''

          const { error } = await supabase
            .from('teams')
            .update({
              division: team.division,
              pool: pool,
              phase: 2,
              cla: parseInt(team.clt) || 0,
              joue: parseInt(team.joue) || 0,
              pts: parseInt(team.pts) || 0,
              vic: parseInt(team.vic) || 0,
              def: parseInt(team.def) || 0,
              nul: parseInt(team.nul) || 0,
              link_fftt: `D1=${team.D1}&cx_poule=${team.cx_poule}`,
              is_active: true,
            })
            .ilike('name', tlsttName)

          if (!error) {
            supabaseUpdates++
            logs.push(`DB: ${tlsttName} mis a jour`)
          } else {
            errors.push(`DB update ${tlsttName}: ${error.message}`)
          }
        }
      } catch (e: any) {
        errors.push(`Supabase error: ${e.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      discovered: discovered.length,
      supabaseUpdates,
      teams: discovered,
      logs,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      logs,
      errors,
      timestamp: new Date().toISOString(),
    })
  }
}
