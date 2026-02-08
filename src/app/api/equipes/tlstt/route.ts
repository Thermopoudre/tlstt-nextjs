import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Numéro du club TLSTT
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
  pf: string
  pg: string
  pp: string
}

interface Rencontre {
  libelle: string
  equa: string
  equb: string
  scorea: string
  scoreb: string
  dateprevue: string
  datereelle: string
  lien: string
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

    // 1. Récupérer les équipes du club TLSTT
    const equipesUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
    const equipesResponse = await fetch(equipesUrl, { cache: 'no-store' })
    const equipesXml = await equipesResponse.text()
    const equipes = parseEquipesXml(equipesXml)

    // 2. Pour chaque équipe, récupérer classement et rencontres
    const equipesWithData = await Promise.all(
      equipes.map(async (equipe) => {
        // Extraire cx_poule et D1 du liendivision
        const params = new URLSearchParams(equipe.liendivision)
        const cx_poule = params.get('cx_poule') || ''
        const D1 = params.get('D1') || ''

        if (!D1) {
          return { ...equipe, classement: [], rencontres: [] }
        }

        // Regen timestamp pour chaque appel
        const tm2 = generateTimestamp()
        const tmc2 = encryptTimestamp(tm2, password)

        // Récupérer classement
        const classementUrl = `https://www.fftt.com/mobile/pxml/xml_result_equ.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&action=classement&auto=1&D1=${D1}&cx_poule=${cx_poule}`
        const classementResponse = await fetch(classementUrl, { cache: 'no-store' })
        const classementXml = await classementResponse.text()
        const classement = parseClassementXml(classementXml)

        // Regen timestamp
        const tm3 = generateTimestamp()
        const tmc3 = encryptTimestamp(tm3, password)

        // Récupérer rencontres
        const rencontresUrl = `https://www.fftt.com/mobile/pxml/xml_result_equ.php?serie=${serie}&tm=${tm3}&tmc=${tmc3}&id=${appId}&action=&auto=1&D1=${D1}&cx_poule=${cx_poule}`
        const rencontresResponse = await fetch(rencontresUrl, { cache: 'no-store' })
        const rencontresXml = await rencontresResponse.text()
        const rencontres = parseRencontresXml(rencontresXml)

        return {
          ...equipe,
          cx_poule,
          D1,
          classement,
          rencontres
        }
      })
    )

    return NextResponse.json({
      equipes: equipesWithData,
      clubNumber: TLSTT_CLUB_NUMBER,
      source: 'api'
    })

  } catch (error: any) {
    console.error('Erreur API equipes TLSTT:', error)
    return NextResponse.json({ 
      equipes: [], 
      error: error.message 
    })
  }
}

function parseEquipesXml(xml: string): Equipe[] {
  if (!xml || xml.includes('<erreur>')) return []

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
      nul: getValue('nul'),
      pf: getValue('pf'),
      pg: getValue('pg'),
      pp: getValue('pp')
    })
  }

  return classements
}

function parseRencontresXml(xml: string): Rencontre[] {
  if (!xml || xml.includes('<erreur>')) return []

  const rencontres: Rencontre[] = []
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

function generateTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}${ms}`
}

function encryptTimestamp(timestamp: string, password: string): string {
  const md5Key = crypto.createHash('md5').update(password).digest('hex')
  const hmac = crypto.createHmac('sha1', md5Key)
  hmac.update(timestamp)
  return hmac.digest('hex')
}
