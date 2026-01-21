import { NextResponse } from 'next/server'
import crypto from 'crypto'

interface RouteParams {
  params: Promise<{ numero: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { numero } = await params

  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    if (!appId || !password || !serie) {
      return NextResponse.json({ 
        club: null, 
        error: 'Credentials SmartPing manquants' 
      })
    }

    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    const url = `https://www.fftt.com/mobile/pxml/xml_club_detail.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${numero}`
    const response = await fetch(url, { cache: 'no-store' })
    const xml = await response.text()

    const club = parseClubDetailXml(xml)

    return NextResponse.json({
      club,
      source: 'api'
    })

  } catch (error: any) {
    console.error('Erreur API club detail:', error)
    return NextResponse.json({ 
      club: null, 
      error: error.message 
    })
  }
}

function parseClubDetailXml(xml: string) {
  if (!xml || xml.includes('<erreur>')) return null

  const getValue = (tag: string): string => {
    const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
    return m ? m[1] : ''
  }

  const adresse1 = getValue('adressesalle1')
  const adresse2 = getValue('adressesalle2')
  const adresse3 = getValue('adressesalle3')
  const adresse = [adresse1, adresse2, adresse3].filter(Boolean).join(', ')

  return {
    idclub: getValue('idclub'),
    numero: getValue('numero'),
    nomsalle: getValue('nomsalle'),
    adresse,
    adressesalle1: adresse1,
    adressesalle2: adresse2,
    adressesalle3: adresse3,
    codePostal: getValue('codepsalle'),
    ville: getValue('villesalle'),
    web: getValue('web'),
    nomCorrespondant: getValue('nomcor'),
    prenomCorrespondant: getValue('prenomcor'),
    email: getValue('mailcor'),
    telephone: getValue('telcor'),
    latitude: getValue('latitude'),
    longitude: getValue('longitude')
  }
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
