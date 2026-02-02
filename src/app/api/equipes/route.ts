import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Numéro du club TLSTT Toulon La Seyne
const TLSTT_CLUB_NUMBER = '13830083'

interface Equipe {
  libequipe: string
  libdivision: string
  liendivision: string
  idepr: string
  libepr: string
}

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
  libequipe: string
  libepr: string
  libdivision: string
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  classement: Classement[]
}

export async function GET() {
  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    if (!appId || !password || !serie) {
      return NextResponse.json({ 
        equipes: [], 
        error: 'Credentials SmartPing manquants' 
      })
    }

    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // 1. Récupérer les équipes du club
    const equipesUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
    
    console.log('📋 Récupération équipes TLSTT...')
    const equipesResponse = await fetch(equipesUrl, { cache: 'no-store' })
    const equipesXml = await equipesResponse.text()
    
    if (equipesXml.includes('<erreur>')) {
      const error = equipesXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || 'Erreur API FFTT'
      return NextResponse.json({ equipes: [], error })
    }

    const equipes = parseEquipesXml(equipesXml)
    console.log(`📥 ${equipes.length} équipes trouvées`)

    if (equipes.length === 0) {
      return NextResponse.json({ 
        equipes: [], 
        message: 'Aucune équipe trouvée pour ce club',
        clubNumber: TLSTT_CLUB_NUMBER
      })
    }

    // 2. Pour chaque équipe, récupérer le classement
    const equipesWithData: EquipeComplete[] = []

    for (const equipe of equipes) {
      try {
        // Extraire cx_poule et D1 du liendivision
        const params = new URLSearchParams(equipe.liendivision)
        const cx_poule = params.get('cx_poule') || ''
        const D1 = params.get('D1') || ''

        let teamData: EquipeComplete = {
          libequipe: equipe.libequipe,
          libepr: equipe.libepr,
          libdivision: equipe.libdivision,
          cla: 0,
          joue: 0,
          pts: 0,
          vic: 0,
          def: 0,
          nul: 0,
          classement: []
        }

        if (D1) {
          // Regen timestamp
          const tm2 = generateTimestamp()
          const tmc2 = encryptTimestamp(tm2, password)

          // Récupérer classement de la poule
          const classementUrl = `https://www.fftt.com/mobile/pxml/xml_result_equ.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&action=classement&auto=1&D1=${D1}&cx_poule=${cx_poule}`
          
          const classementResponse = await fetch(classementUrl, { cache: 'no-store' })
          const classementXml = await classementResponse.text()
          const classement = parseClassementXml(classementXml)

          // Trouver notre équipe dans le classement
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

        equipesWithData.push(teamData)
      } catch (err) {
        console.error(`Erreur équipe ${equipe.libequipe}:`, err)
        equipesWithData.push({
          libequipe: equipe.libequipe,
          libepr: equipe.libepr,
          libdivision: equipe.libdivision,
          cla: 0,
          joue: 0,
          pts: 0,
          vic: 0,
          def: 0,
          nul: 0,
          classement: []
        })
      }

      // Petit délai entre les appels
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({
      equipes: equipesWithData,
      clubNumber: TLSTT_CLUB_NUMBER,
      source: 'FFTT Live',
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

function parseEquipesXml(xml: string): Equipe[] {
  if (!xml) return []

  const equipes: Equipe[] = []
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
