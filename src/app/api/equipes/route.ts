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
    const storedSerie = process.env.SMARTPING_SERIE || ''

    if (!appId || !password) {
      return NextResponse.json({ 
        equipes: [], 
        error: 'Credentials SmartPing manquants' 
      })
    }

    // Etape 1: Initialiser la série via xml_initialisation.php
    // (comme le fait la version PHP dans son constructeur)
    // Ceci est REQUIS pour certains endpoints comme xml_equipe.php
    const freshSerie = generateSerie()
    const tmInit = generateTimestamp()
    const tmcInit = encryptTimestamp(tmInit, password)

    let serie = storedSerie // Par défaut, utiliser la série stockée
    let initMethod = 'stored'

    try {
      const initUrl = `https://www.fftt.com/mobile/pxml/xml_initialisation.php?serie=${freshSerie}&tm=${tmInit}&tmc=${tmcInit}&id=${appId}`
      const initResponse = await fetch(initUrl, { cache: 'no-store' })
      const initXml = await initResponse.text()
      
      // Vérifier si l'initialisation a réussi
      if (initXml.includes('<appli>1</appli>') || !initXml.includes('<erreur>')) {
        serie = freshSerie // Utiliser la nouvelle série fraîchement validée
        initMethod = 'fresh'
        console.log('✅ Série initialisée avec succès:', freshSerie)
      } else {
        console.warn('⚠️ Initialisation échouée, utilisation série stockée')
      }
    } catch (initErr) {
      console.warn('⚠️ Erreur initialisation, utilisation série stockée:', initErr)
    }

    // Petit délai après initialisation pour laisser le temps au serveur FFTT
    await new Promise(r => setTimeout(r, 300))

    // Etape 2: Récupérer les équipes avec la série (fraîche ou stockée)
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)
    const equipesUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
    
    console.log(`📋 Récupération équipes TLSTT (série: ${initMethod})...`)
    const equipesResponse = await fetch(equipesUrl, { cache: 'no-store' })
    const equipesXml = await equipesResponse.text()
    
    // Si la série fraîche échoue aussi, tenter avec la série stockée comme fallback
    let finalEquipesXml = equipesXml
    if (equipesXml.includes('<erreur>') && initMethod === 'fresh' && storedSerie) {
      console.log('⚠️ Série fraîche échouée, tentative avec série stockée...')
      const tm3 = generateTimestamp()
      const tmc3 = encryptTimestamp(tm3, password)
      const fallbackUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${storedSerie}&tm=${tm3}&tmc=${tmc3}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
      const fallbackResponse = await fetch(fallbackUrl, { cache: 'no-store' })
      finalEquipesXml = await fallbackResponse.text()
      
      if (!finalEquipesXml.includes('<erreur>')) {
        initMethod = 'stored-fallback'
      }
    }

    // Si les deux méthodes échouent, tenter avec type=M (masculin) et type=A
    if (finalEquipesXml.includes('<erreur>')) {
      for (const type of ['M', 'A', 'F']) {
        const tmType = generateTimestamp()
        const tmcType = encryptTimestamp(tmType, password)
        const typeUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tmType}&tmc=${tmcType}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}&type=${type}`
        const typeResponse = await fetch(typeUrl, { cache: 'no-store' })
        const typeXml = await typeResponse.text()
        
        if (!typeXml.includes('<erreur>')) {
          finalEquipesXml = typeXml
          initMethod = `type-${type}`
          console.log(`✅ Endpoint fonctionnel avec type=${type}`)
          break
        }
      }
    }
    
    if (finalEquipesXml.includes('<erreur>')) {
      const error = finalEquipesXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || 'Erreur API FFTT'
      console.error(`❌ xml_equipe.php échoué (toutes tentatives): ${error}`)
      return NextResponse.json({ 
        equipes: [], 
        error,
        debug: { initMethod, serie: serie.substring(0, 5) + '...' }
      })
    }

    const equipes = parseEquipesXml(finalEquipesXml)
    console.log(`📥 ${equipes.length} équipes trouvées`)

    if (equipes.length === 0) {
      return NextResponse.json({ 
        equipes: [], 
        message: 'Aucune équipe trouvée pour ce club',
        clubNumber: TLSTT_CLUB_NUMBER
      })
    }

    // Etape 3: Pour chaque équipe, récupérer le classement
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
          const tm2 = generateTimestamp()
          const tmc2 = encryptTimestamp(tm2, password)

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
      initMethod,
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

function generateSerie(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let serie = ''
  for (let i = 0; i < 15; i++) {
    serie += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return serie
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
