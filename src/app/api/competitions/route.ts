import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Numéro du club TLSTT
const TLSTT_CLUB_NUMBER = '08830142'

export async function GET() {
  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    if (!appId || !password || !serie) {
      return NextResponse.json({ 
        competitions: [], 
        error: 'Credentials SmartPing manquants' 
      })
    }

    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // 1. Récupérer les équipes du club TLSTT pour avoir leurs poules
    const equipesUrl = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
    const equipesResponse = await fetch(equipesUrl, { cache: 'no-store' })
    const equipesXml = await equipesResponse.text()
    const equipes = parseEquipesXml(equipesXml)

    // 2. Pour chaque équipe, récupérer les dates des rencontres
    const allCompetitions: any[] = []

    for (const equipe of equipes) {
      const params = new URLSearchParams(equipe.liendivision)
      const cx_poule = params.get('cx_poule') || ''
      const D1 = params.get('D1') || ''

      if (!D1) continue

      const tm2 = generateTimestamp()
      const tmc2 = encryptTimestamp(tm2, password)

      // Récupérer les rencontres (dates prévues)
      const rencontresUrl = `https://www.fftt.com/mobile/pxml/xml_result_equ.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&action=&auto=1&D1=${D1}&cx_poule=${cx_poule}`
      const rencontresResponse = await fetch(rencontresUrl, { cache: 'no-store' })
      const rencontresXml = await rencontresResponse.text()
      const rencontres = parseRencontresXml(rencontresXml)

      // Filtrer les rencontres TLSTT
      const tlsttRencontres = rencontres.filter(r => 
        r.equa.toUpperCase().includes('SEYNE') || 
        r.equa.toUpperCase().includes('TLSTT') ||
        r.equb.toUpperCase().includes('SEYNE') || 
        r.equb.toUpperCase().includes('TLSTT')
      )

      for (const renc of tlsttRencontres) {
        const isTLSTTa = renc.equa.toUpperCase().includes('SEYNE') || renc.equa.toUpperCase().includes('TLSTT')
        const adversaire = isTLSTTa ? renc.equb : renc.equa
        const domicile = isTLSTTa

        allCompetitions.push({
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
        })
      }
    }

    // Trier par date
    allCompetitions.sort((a, b) => {
      const dateA = parseFrenchDate(a.datePrevue || a.dateReelle)
      const dateB = parseFrenchDate(b.datePrevue || b.dateReelle)
      return dateA.localeCompare(dateB)
    })

    // Séparer passées et à venir
    const today = new Date().toISOString().split('T')[0]
    const passees = allCompetitions.filter(c => {
      const date = parseFrenchDate(c.datePrevue || c.dateReelle)
      return date < today || c.joue
    }).reverse() // Plus récentes en premier

    const aVenir = allCompetitions.filter(c => {
      const date = parseFrenchDate(c.datePrevue || c.dateReelle)
      return date >= today && !c.joue
    })

    return NextResponse.json({
      aVenir,
      passees: passees.slice(0, 20), // Limiter à 20 dernières
      total: allCompetitions.length,
      source: 'api'
    })

  } catch (error: any) {
    console.error('Erreur API competitions:', error)
    return NextResponse.json({ 
      aVenir: [], 
      passees: [],
      error: error.message 
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
  
  // Format DD/MM/YYYY -> YYYY-MM-DD
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${year}-${month}-${day}`
  }
  
  return dateStr
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
