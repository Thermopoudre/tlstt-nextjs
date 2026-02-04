import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Endpoint de debug pour comparer xml_liste_joueur et xml_equipe
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''
  const clubId = '13830083'

  if (!appId || !password || !serie) {
    return NextResponse.json({
      error: 'Variables manquantes',
      hasAppId: !!appId,
      hasPassword: !!password,
      hasSerie: !!serie
    })
  }

  const results: any = {
    credentials: {
      appId,
      passwordLength: password.length,
      serieLength: serie.length,
      clubId
    },
    tests: {}
  }

  // Test 1: xml_liste_joueur.php (FONCTIONNE)
  try {
    const tm1 = generateTimestamp()
    const tmc1 = encryptTimestamp(tm1, password)
    const url1 = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm1}&tmc=${tmc1}&id=${appId}&club=${clubId}`
    
    const response1 = await fetch(url1, { cache: 'no-store' })
    const xml1 = await response1.text()
    
    results.tests.xml_liste_joueur = {
      url: url1.replace(password, '***').replace(serie, 'SERIE***'),
      status: response1.status,
      hasError: xml1.includes('<erreur>'),
      errorMsg: xml1.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      joueurCount: (xml1.match(/<joueur>/g) || []).length,
      preview: xml1.substring(0, 300)
    }
  } catch (e: any) {
    results.tests.xml_liste_joueur = { error: e.message }
  }

  // Test 2: xml_equipe.php avec numclu (paramètre actuel)
  try {
    const tm2 = generateTimestamp()
    const tmc2 = encryptTimestamp(tm2, password)
    const url2 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&numclu=${clubId}`
    
    const response2 = await fetch(url2, { cache: 'no-store' })
    const xml2 = await response2.text()
    
    results.tests.xml_equipe_numclu = {
      url: url2.replace(password, '***').replace(serie, 'SERIE***'),
      status: response2.status,
      hasError: xml2.includes('<erreur>'),
      errorMsg: xml2.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      equipeCount: (xml2.match(/<equipe>/g) || []).length,
      preview: xml2.substring(0, 500)
    }
  } catch (e: any) {
    results.tests.xml_equipe_numclu = { error: e.message }
  }

  // Test 3: xml_equipe.php avec club (alternative)
  try {
    const tm3 = generateTimestamp()
    const tmc3 = encryptTimestamp(tm3, password)
    const url3 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm3}&tmc=${tmc3}&id=${appId}&club=${clubId}`
    
    const response3 = await fetch(url3, { cache: 'no-store' })
    const xml3 = await response3.text()
    
    results.tests.xml_equipe_club = {
      url: url3.replace(password, '***').replace(serie, 'SERIE***'),
      status: response3.status,
      hasError: xml3.includes('<erreur>'),
      errorMsg: xml3.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      equipeCount: (xml3.match(/<equipe>/g) || []).length,
      preview: xml3.substring(0, 500)
    }
  } catch (e: any) {
    results.tests.xml_equipe_club = { error: e.message }
  }

  // Test 4: xml_equipe.php avec type=M
  try {
    const tm4 = generateTimestamp()
    const tmc4 = encryptTimestamp(tm4, password)
    const url4 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm4}&tmc=${tmc4}&id=${appId}&numclu=${clubId}&type=M`
    
    const response4 = await fetch(url4, { cache: 'no-store' })
    const xml4 = await response4.text()
    
    results.tests.xml_equipe_typeM = {
      url: url4.replace(password, '***').replace(serie, 'SERIE***'),
      status: response4.status,
      hasError: xml4.includes('<erreur>'),
      errorMsg: xml4.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      equipeCount: (xml4.match(/<equipe>/g) || []).length,
      preview: xml4.substring(0, 500)
    }
  } catch (e: any) {
    results.tests.xml_equipe_typeM = { error: e.message }
  }

  // Test 5: xml_equipe.php SANS paramètre club (juste auth)
  try {
    const tm5 = generateTimestamp()
    const tmc5 = encryptTimestamp(tm5, password)
    const url5 = `https://www.fftt.com/mobile/pxml/xml_equipe.php?serie=${serie}&tm=${tm5}&tmc=${tmc5}&id=${appId}`
    
    const response5 = await fetch(url5, { cache: 'no-store' })
    const xml5 = await response5.text()
    
    results.tests.xml_equipe_noclub = {
      url: url5.replace(password, '***').replace(serie, 'SERIE***'),
      status: response5.status,
      hasError: xml5.includes('<erreur>'),
      errorMsg: xml5.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || null,
      preview: xml5.substring(0, 500)
    }
  } catch (e: any) {
    results.tests.xml_equipe_noclub = { error: e.message }
  }

  return NextResponse.json(results)
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
