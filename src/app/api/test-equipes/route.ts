import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Test endpoint pour xml_equipe.php
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''
  const clubId = '13830083'

  if (!appId || !password || !serie) {
    return NextResponse.json({
      error: 'Variables SmartPing manquantes',
      config: { hasAppId: !!appId, hasPassword: !!password, hasSerie: !!serie }
    })
  }

  const results: any = {}

  // Test 1: xml_equipe.php
  try {
    const tm1 = generateTimestamp()
    const tmc1 = encryptTimestamp(tm1, password)
    const url1 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm1}&tmc=${tmc1}&id=${appId}&numclu=${clubId}`
    
    const response1 = await fetch(url1, { cache: 'no-store' })
    const xml1 = await response1.text()
    
    results.xml_equipe = {
      status: response1.status,
      hasError: xml1.includes('<erreur>'),
      errorMsg: xml1.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      preview: xml1.substring(0, 500)
    }
  } catch (e: any) {
    results.xml_equipe = { error: e.message }
  }

  // Test 2: xml_equipe.php avec type=M (masculin)
  try {
    const tm2 = generateTimestamp()
    const tmc2 = encryptTimestamp(tm2, password)
    const url2 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&numclu=${clubId}&type=M`
    
    const response2 = await fetch(url2, { cache: 'no-store' })
    const xml2 = await response2.text()
    
    results.xml_equipe_typeM = {
      status: response2.status,
      hasError: xml2.includes('<erreur>'),
      errorMsg: xml2.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      preview: xml2.substring(0, 500)
    }
  } catch (e: any) {
    results.xml_equipe_typeM = { error: e.message }
  }

  // Test 3: xml_equipe.php avec type=A (tous)
  try {
    const tm3 = generateTimestamp()
    const tmc3 = encryptTimestamp(tm3, password)
    const url3 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm3}&tmc=${tmc3}&id=${appId}&numclu=${clubId}&type=A`
    
    const response3 = await fetch(url3, { cache: 'no-store' })
    const xml3 = await response3.text()
    
    results.xml_equipe_typeA = {
      status: response3.status,
      hasError: xml3.includes('<erreur>'),
      errorMsg: xml3.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      preview: xml3.substring(0, 500)
    }
  } catch (e: any) {
    results.xml_equipe_typeA = { error: e.message }
  }

  return NextResponse.json({
    clubId,
    timestamp: new Date().toISOString(),
    results
  })
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
