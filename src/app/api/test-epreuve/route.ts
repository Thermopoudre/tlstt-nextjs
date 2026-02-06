import { NextResponse } from 'next/server'
import crypto from 'crypto'

const TLSTT_CLUB_NUMBER = '13830083'

export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''

  if (!appId || !password) {
    return NextResponse.json({ error: 'Missing credentials' })
  }

  const results: Record<string, any> = {}

  // Test 1: xml_epreuve.php (liste des épreuves)
  try {
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)
    const url = `https://www.fftt.com/mobile/pxml/xml_epreuve.php?serie=${process.env.SMARTPING_SERIE}&tm=${tm}&tmc=${tmc}&id=${appId}&type=E&numclu=${TLSTT_CLUB_NUMBER}`
    const resp = await fetch(url, { cache: 'no-store' })
    results.epreuve = { status: resp.status, body: await resp.text() }
  } catch (e: any) {
    results.epreuve = { error: e.message }
  }

  // Test 2: xml_epreuve.php avec organisme D83 (Var)
  try {
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)
    const url = `https://www.fftt.com/mobile/pxml/xml_epreuve.php?serie=${process.env.SMARTPING_SERIE}&tm=${tm}&tmc=${tmc}&id=${appId}&type=E&organisme=D83`
    const resp = await fetch(url, { cache: 'no-store' })
    results.epreuveD83 = { status: resp.status, body: (await resp.text()).substring(0, 2000) }
  } catch (e: any) {
    results.epreuveD83 = { error: e.message }
  }

  // Test 3: xml_equipe.php avec série d'env
  try {
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)
    const url = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${process.env.SMARTPING_SERIE}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}&type=M`
    const resp = await fetch(url, { cache: 'no-store' })
    results.equipe_M = { status: resp.status, body: await resp.text() }
  } catch (e: any) {
    results.equipe_M = { error: e.message }
  }

  // Test 4: init frais + equipe
  try {
    const freshSerie = generateSerie()
    const tmInit = generateTimestamp()
    const tmcInit = encryptTimestamp(tmInit, password)
    const initUrl = `https://www.fftt.com/mobile/pxml/xml_initialisation.php?serie=${freshSerie}&tm=${tmInit}&tmc=${tmcInit}&id=${appId}`
    const initResp = await fetch(initUrl, { cache: 'no-store' })
    const initBody = await initResp.text()
    results.init = { body: initBody }

    await new Promise(r => setTimeout(r, 500))

    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)
    const url = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${freshSerie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
    const resp = await fetch(url, { cache: 'no-store' })
    results.equipe_fresh = { status: resp.status, body: await resp.text() }
  } catch (e: any) {
    results.equipe_fresh = { error: e.message }
  }

  // Test 5: xml_club_dep2.php  
  try {
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)
    const url = `https://www.fftt.com/mobile/pxml/xml_club_dep2.php?serie=${process.env.SMARTPING_SERIE}&tm=${tm}&tmc=${tmc}&id=${appId}&dep=83`
    const resp = await fetch(url, { cache: 'no-store' })
    const body = await resp.text()
    // Chercher TLSTT dans la liste
    const tlsttMatch = body.match(/<club>[\s\S]*?13830083[\s\S]*?<\/club>/)
    results.clubDep = { 
      status: resp.status, 
      hasError: body.includes('<erreur>'),
      tlsttFound: !!tlsttMatch,
      tlsttData: tlsttMatch ? tlsttMatch[0] : null,
      bodyLength: body.length
    }
  } catch (e: any) {
    results.clubDep = { error: e.message }
  }

  return NextResponse.json(results, { status: 200 })
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
