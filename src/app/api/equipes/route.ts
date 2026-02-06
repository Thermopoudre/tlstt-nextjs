import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Numéro du club TLSTT Toulon La Seyne
const TLSTT_CLUB_NUMBER = '13830083'

interface Classement {
  poule: string
  clt: string
  equipe: string
  joue: string
  pts: string
  numero: string
  vic: string
  def: string
  nul: string
}

interface EquipeComplete {
  id?: number
  name: string
  division: string
  pool: string
  phase: number
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  link_fftt: string | null
  classement: Classement[]
}

export async function GET() {
  const supabase = await createClient()

  try {
    // 1. Toujours récupérer les données depuis Supabase d'abord
    const { data: teamsFromDb, error: dbError } = await supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('division', { ascending: true })

    if (dbError) {
      console.error('Erreur lecture teams Supabase:', dbError)
    }

    // 2. Tenter de rafraîchir via l'API FFTT (en arrière-plan)
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const storedSerie = process.env.SMARTPING_SERIE || ''

    let ffttEquipes: EquipeComplete[] = []
    let ffttAvailable = false
    let ffttError = ''

    if (appId && password) {
      try {
        // Initialiser une série fraîche
        const freshSerie = generateSerie()
        const tmInit = generateTimestamp()
        const tmcInit = encryptTimestamp(tmInit, password)
        
        let serie = storedSerie
        
        // Tenter l'initialisation
        const initUrl = `https://www.fftt.com/mobile/pxml/xml_initialisation.php?serie=${freshSerie}&tm=${tmInit}&tmc=${tmcInit}&id=${appId}`
        const initResponse = await fetch(initUrl, { cache: 'no-store' })
        const initXml = await initResponse.text()
        
        if (!initXml.includes('<erreur>')) {
          serie = freshSerie
        }

        // Petit délai après initialisation
        await new Promise(r => setTimeout(r, 200))

        // Tenter xml_equipe.php
        const tm = generateTimestamp()
        const tmc = encryptTimestamp(tm, password)
        const equipesUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
        
        const equipesResponse = await fetch(equipesUrl, { cache: 'no-store' })
        const equipesXml = await equipesResponse.text()
        
        if (!equipesXml.includes('<erreur>')) {
          ffttAvailable = true
          const parsedEquipes = parseEquipesXml(equipesXml)
          
          // Si on a des équipes, les enrichir et les sauvegarder
          for (const equipe of parsedEquipes) {
            const teamData: EquipeComplete = {
              name: equipe.libequipe,
              division: equipe.libdivision,
              pool: '',
              phase: 1,
              cla: 0,
              joue: 0,
              pts: 0,
              vic: 0,
              def: 0,
              nul: 0,
              link_fftt: equipe.liendivision,
              classement: []
            }

            // Extraire D1 et cx_poule pour récupérer le classement
            if (equipe.liendivision) {
              try {
                const params = new URLSearchParams(equipe.liendivision)
                const cx_poule = params.get('cx_poule') || ''
                const D1 = params.get('D1') || ''
                teamData.pool = cx_poule

                if (D1) {
                  const tm2 = generateTimestamp()
                  const tmc2 = encryptTimestamp(tm2, password)
                  const classementUrl = `https://www.fftt.com/mobile/pxml/xml_result_equ.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&action=classement&auto=1&D1=${D1}&cx_poule=${cx_poule}`
                  
                  const classementResponse = await fetch(classementUrl, { cache: 'no-store' })
                  const classementXml = await classementResponse.text()
                  const classement = parseClassementXml(classementXml)

                  const ourTeam = classement.find(c =>
                    c.numero === TLSTT_CLUB_NUMBER ||
                    c.equipe.toLowerCase().includes('toulon') ||
                    c.equipe.toLowerCase().includes('tlstt') ||
                    c.equipe.toLowerCase().includes('seyne')
                  )

                  if (ourTeam) {
                    teamData.cla = parseInt(ourTeam.clt) || 0
                    teamData.joue = parseInt(ourTeam.joue) || 0
                    teamData.pts = parseInt(ourTeam.pts) || 0
                    teamData.vic = parseInt(ourTeam.vic) || 0
                    teamData.def = parseInt(ourTeam.def) || 0
                    teamData.nul = parseInt(ourTeam.nul) || 0
                  }

                  teamData.classement = classement
                }
              } catch {
                // Ignorer les erreurs de classement
              }
            }

            ffttEquipes.push(teamData)
            await new Promise(r => setTimeout(r, 200))
          }

          // Sauvegarder dans Supabase pour la prochaine fois
          if (ffttEquipes.length > 0) {
            for (const team of ffttEquipes) {
              const { data: existing } = await supabase
                .from('teams')
                .select('id')
                .eq('name', team.name)
                .single()

              const teamRow = {
                name: team.name,
                division: team.division,
                pool: team.pool,
                phase: team.phase,
                link_fftt: team.link_fftt,
                cla: team.cla,
                joue: team.joue,
                pts: team.pts,
                vic: team.vic,
                def: team.def,
                nul: team.nul,
                is_active: true,
                updated_at: new Date().toISOString()
              }

              if (existing) {
                await supabase.from('teams').update(teamRow).eq('id', existing.id)
              } else {
                await supabase.from('teams').insert(teamRow)
              }
            }
          }
        } else {
          ffttError = equipesXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || 'Erreur API FFTT'
        }
      } catch (err: any) {
        ffttError = err.message
      }
    }

    // 3. Retourner les données disponibles
    // Priorité : FFTT live > Supabase stocké
    let equipesToReturn: EquipeComplete[] = []
    let source = 'Aucune donnée'

    if (ffttAvailable && ffttEquipes.length > 0) {
      equipesToReturn = ffttEquipes
      source = 'FFTT Live'
    } else if (teamsFromDb && teamsFromDb.length > 0) {
      equipesToReturn = teamsFromDb.map(t => ({
        id: t.id,
        name: t.name,
        division: t.division || '',
        pool: t.pool || '',
        phase: t.phase || 1,
        cla: t.cla || 0,
        joue: t.joue || 0,
        pts: t.pts || 0,
        vic: t.vic || 0,
        def: t.def || 0,
        nul: t.nul || 0,
        link_fftt: t.link_fftt,
        classement: []
      }))
      source = 'Base de données'
    }

    // Reformater pour la compatibilité avec la page frontend
    const equipes = equipesToReturn.map(e => ({
      libequipe: e.name,
      libepr: e.division,
      libdivision: e.division,
      cla: e.cla,
      joue: e.joue,
      pts: e.pts,
      vic: e.vic,
      def: e.def,
      nul: e.nul,
      classement: e.classement || []
    }))

    return NextResponse.json({
      equipes,
      clubNumber: TLSTT_CLUB_NUMBER,
      source,
      ffttError: ffttError || undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur API equipes:', error)
    return NextResponse.json({
      equipes: [],
      error: error.message
    })
  }
}

function parseEquipesXml(xml: string): { libequipe: string; libdivision: string; liendivision: string; idepr: string; libepr: string }[] {
  if (!xml) return []

  const equipes: { libequipe: string; libdivision: string; liendivision: string; idepr: string; libepr: string }[] = []
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

function parseClassementXml(xml: string): Classement[] {
  if (!xml || xml.includes('<erreur>')) return []

  const classements: Classement[] = []
  const matches = xml.matchAll(/<classement>([\s\S]*?)<\/classement>/g)

  for (const match of matches) {
    const clXml = match[1]
    const getValue = (tag: string): string => {
      const m = clXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }

    classements.push({
      poule: getValue('poule'),
      clt: getValue('clt'),
      equipe: getValue('equipe'),
      joue: getValue('joue'),
      pts: getValue('pts'),
      numero: getValue('numero'),
      vic: getValue('vic'),
      def: getValue('def'),
      nul: getValue('nul')
    })
  }

  return classements
}

function generateSerie(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let serie = ''
  for (let i = 0; i < 15; i++) {
    serie += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return serie
}

function generateTimestamp(): string {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`
}

function encryptTimestamp(timestamp: string, password: string): string {
  const md5Key = crypto.createHash('md5').update(password).digest('hex')
  const hmac = crypto.createHmac('sha1', md5Key)
  hmac.update(timestamp)
  return hmac.digest('hex')
}
