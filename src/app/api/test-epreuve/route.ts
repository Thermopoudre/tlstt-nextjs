import { NextResponse } from 'next/server'
import crypto from 'crypto'

const TLSTT_CLUB_NUMBER = '13830083'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testId = searchParams.get('test') || 'epreuve'

  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''

  if (!appId || !password) {
    return NextResponse.json({ error: 'Missing credentials' })
  }

  // Un seul test à la fois pour éviter le rate limiting
  const tm = generateTimestamp()
  const tmc = encryptTimestamp(tm, password)
  
  let url = ''
  let testName = ''

  switch (testId) {
    case 'epreuve_org':
      // xml_epreuve.php avec organisme D83 (Var)
      testName = 'xml_epreuve.php organisme=D83'
      url = `https://www.fftt.com/mobile/pxml/xml_epreuve.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&type=E&organisme=D83`
      break
    case 'epreuve_clu':
      // xml_epreuve.php avec numclu
      testName = 'xml_epreuve.php numclu=' + TLSTT_CLUB_NUMBER
      url = `https://www.fftt.com/mobile/pxml/xml_epreuve.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&type=E&numclu=${TLSTT_CLUB_NUMBER}`
      break
    case 'equipe':
      // xml_equipe.php
      testName = 'xml_equipe.php numclu=' + TLSTT_CLUB_NUMBER
      url = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}`
      break
    case 'equipe_type':
      // xml_equipe.php avec type
      testName = 'xml_equipe.php numclu + type=M'
      url = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numclu=${TLSTT_CLUB_NUMBER}&type=M`
      break
    case 'joueur':
      // xml_joueur.php (devrait fonctionner)
      testName = 'xml_joueur.php licence=8314677'
      url = `https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=8314677`
      break
    case 'init':
      // xml_initialisation.php avec série fraiche
      const freshSerie = generateSerie()
      testName = 'xml_initialisation.php freshSerie=' + freshSerie
      url = `https://www.fftt.com/mobile/pxml/xml_initialisation.php?serie=${freshSerie}&tm=${tm}&tmc=${tmc}&id=${appId}`
      break
    case 'division':
      // xml_division.php
      testName = 'xml_division.php organisme=D83'
      url = `https://www.fftt.com/mobile/pxml/xml_division.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&organisme=D83&type=E`
      break
    case 'club':
      // xml_club_b.php
      testName = 'xml_club_b.php numero=' + TLSTT_CLUB_NUMBER
      url = `https://www.fftt.com/mobile/pxml/xml_club_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numero=${TLSTT_CLUB_NUMBER}`
      break
    case 'liste':
      // xml_liste_joueur.php (contrôle - devrait fonctionner)
      testName = 'xml_liste_joueur.php club=' + TLSTT_CLUB_NUMBER
      url = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${TLSTT_CLUB_NUMBER}`
      break
    default:
      // xml_epreuve.php sans organisme
      testName = 'xml_epreuve.php type=E + numclu'
      url = `https://www.fftt.com/mobile/pxml/xml_epreuve.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&type=E&numclu=${TLSTT_CLUB_NUMBER}`
  }

  try {
    console.log(`🔍 Test: ${testName}`)
    console.log(`📎 URL: ${url}`)
    
    const resp = await fetch(url, { cache: 'no-store' })
    const body = await resp.text()
    
    return NextResponse.json({
      test: testName,
      status: resp.status,
      hasError: body.includes('<erreur>'),
      bodyLength: body.length,
      body: body.length > 5000 ? body.substring(0, 5000) + '...' : body,
      params: { serie: serie.substring(0, 5) + '...', tm, appId: appId.substring(0, 5) + '...' }
    })
  } catch (e: any) {
    return NextResponse.json({ test: testName, error: e.message })
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
