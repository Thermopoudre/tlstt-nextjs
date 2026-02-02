import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Test d'un joueur individuel via xml_licence_b
export async function GET(request: Request) {
  const url = new URL(request.url)
  const licence = url.searchParams.get('licence') || '8315151' // Licence test par défaut

  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''

  if (!appId || !password || !serie) {
    return NextResponse.json({
      success: false,
      error: 'Variables SmartPing manquantes'
    }, { status: 400 })
  }

  const tm = generateTimestamp()
  const tmc = encryptTimestamp(tm, password)

  try {
    // Test xml_licence_b avec une licence spécifique
    const licenceUrl = `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${licence}`
    
    console.log('Test URL:', licenceUrl)
    
    const response = await fetch(licenceUrl, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'TLSTT-NextJS/1.0' }
    })
    const xml = await response.text()

    // Parser les données
    const pointm = extractValue(xml, 'pointm')
    const apointm = extractValue(xml, 'apointm')
    const initm = extractValue(xml, 'initm')
    const nom = extractValue(xml, 'nom')
    const prenom = extractValue(xml, 'prenom')
    const cat = extractValue(xml, 'cat')
    const nolicence = extractValue(xml, 'licence') || extractValue(xml, 'nolicence')

    const hasError = xml.includes('<erreur>')
    const errorMsg = xml.match(/<erreur>([^<]*)<\/erreur>/)?.[1]

    return NextResponse.json({
      success: !hasError,
      licence: licence,
      httpStatus: response.status,
      hasError,
      errorMsg,
      data: {
        nolicence,
        nom,
        prenom,
        pointm,
        apointm,
        initm,
        cat
      },
      rawXml: xml.substring(0, 2000),
      timestamp: tm,
      url: licenceUrl.replace(password, '***').replace(tmc, 'TMC***')
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1].trim() : null
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
