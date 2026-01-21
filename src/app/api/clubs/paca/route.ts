import { NextResponse } from 'next/server'
import crypto from 'crypto'

interface Club {
  idclub: string
  numero: string
  nom: string
  validation: string
  departement: string
  // Détails
  nomsalle?: string
  adresse?: string
  codePostal?: string
  ville?: string
  web?: string
  nomCorrespondant?: string
  prenomCorrespondant?: string
  email?: string
  telephone?: string
  latitude?: string
  longitude?: string
}

// Départements PACA
const DEPARTEMENTS_PACA = [
  { code: '04', nom: 'Alpes-de-Haute-Provence' },
  { code: '05', nom: 'Hautes-Alpes' },
  { code: '06', nom: 'Alpes-Maritimes' },
  { code: '13', nom: 'Bouches-du-Rhône' },
  { code: '83', nom: 'Var' },
  { code: '84', nom: 'Vaucluse' }
]

export async function GET() {
  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    if (!appId || !password || !serie) {
      return NextResponse.json({ 
        clubs: [], 
        error: 'Credentials SmartPing manquants' 
      })
    }

    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // Récupérer les clubs de chaque département en parallèle
    const clubsByDep = await Promise.all(
      DEPARTEMENTS_PACA.map(async (dep) => {
        const url = `https://www.fftt.com/mobile/pxml/xml_club_dep2.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&dep=${dep.code}`
        const response = await fetch(url, { cache: 'no-store' })
        const xml = await response.text()
        return { dep: dep.code, depNom: dep.nom, clubs: parseClubsXml(xml, dep.code) }
      })
    )

    // Fusionner tous les clubs
    let allClubs: Club[] = []
    for (const { clubs, dep } of clubsByDep) {
      allClubs = allClubs.concat(clubs.map(c => ({ ...c, departement: dep })))
    }

    // Récupérer les détails pour les 100 premiers clubs (limite API)
    // Pour éviter trop d'appels, on ne récupère que les détails à la demande
    const clubsWithBasicInfo = allClubs.map(club => ({
      ...club,
      departementNom: DEPARTEMENTS_PACA.find(d => d.code === club.departement)?.nom || ''
    }))

    // Trier par département puis par nom
    clubsWithBasicInfo.sort((a, b) => {
      if (a.departement !== b.departement) {
        return a.departement.localeCompare(b.departement)
      }
      return a.nom.localeCompare(b.nom)
    })

    return NextResponse.json({
      clubs: clubsWithBasicInfo,
      departements: DEPARTEMENTS_PACA,
      total: clubsWithBasicInfo.length,
      source: 'api'
    })

  } catch (error: any) {
    console.error('Erreur API clubs PACA:', error)
    return NextResponse.json({ 
      clubs: [], 
      error: error.message 
    })
  }
}

function parseClubsXml(xml: string, departement: string): Club[] {
  if (!xml || xml.includes('<erreur>')) return []

  const clubs: Club[] = []
  const clubMatches = xml.matchAll(/<club>([\s\S]*?)<\/club>/g)

  for (const match of clubMatches) {
    const clubXml = match[1]
    const getValue = (tag: string): string => {
      const m = clubXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }

    clubs.push({
      idclub: getValue('idclub'),
      numero: getValue('numero'),
      nom: getValue('nom'),
      validation: getValue('validation'),
      departement
    })
  }

  return clubs
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
