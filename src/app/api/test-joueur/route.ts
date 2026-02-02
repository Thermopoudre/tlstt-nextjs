import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Test de différents endpoints FFTT pour trouver celui qui fonctionne avec les points
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''
  const clubId = '13830083'

  if (!appId || !password || !serie) {
    return NextResponse.json({
      success: false,
      error: 'Variables SmartPing manquantes'
    }, { status: 400 })
  }

  const results: any = {}

  // Test 1: xml_liste_joueur (on sait que ça marche)
  try {
    const tm1 = generateTimestamp()
    const tmc1 = encryptTimestamp(tm1, password)
    const url1 = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm1}&tmc=${tmc1}&id=${appId}&club=${clubId}`
    const res1 = await fetch(url1, { cache: 'no-store' })
    const xml1 = await res1.text()
    
    // Extraire le premier joueur
    const firstJoueur = xml1.match(/<joueur>[\s\S]*?<\/joueur>/)?.[0] || ''
    results.xml_liste_joueur = {
      status: res1.status,
      hasError: xml1.includes('<erreur>'),
      sample: firstJoueur,
      fields: {
        licence: firstJoueur.match(/<licence>([^<]*)<\/licence>/)?.[1],
        nom: firstJoueur.match(/<nom>([^<]*)<\/nom>/)?.[1],
        prenom: firstJoueur.match(/<prenom>([^<]*)<\/prenom>/)?.[1],
        clast: firstJoueur.match(/<clast>([^<]*)<\/clast>/)?.[1]
      }
    }
  } catch (e: any) {
    results.xml_liste_joueur = { error: e.message }
  }

  // Test 2: xml_joueur.php avec nom
  try {
    const tm2 = generateTimestamp()
    const tmc2 = encryptTimestamp(tm2, password)
    const url2 = `https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&nom=ALLES&prenom=Frederic`
    const res2 = await fetch(url2, { cache: 'no-store' })
    const xml2 = await res2.text()
    
    results.xml_joueur = {
      status: res2.status,
      hasError: xml2.includes('<erreur>'),
      errorMsg: xml2.match(/<erreur>([^<]*)<\/erreur>/)?.[1],
      sample: xml2.substring(0, 1000),
      fields: {
        licence: xml2.match(/<licence>([^<]*)<\/licence>/)?.[1],
        point: xml2.match(/<point>([^<]*)<\/point>/)?.[1],
        apts: xml2.match(/<apts>([^<]*)<\/apts>/)?.[1],
        clast: xml2.match(/<clast>([^<]*)<\/clast>/)?.[1]
      }
    }
  } catch (e: any) {
    results.xml_joueur = { error: e.message }
  }

  // Test 3: xml_classement.php
  try {
    const tm3 = generateTimestamp()
    const tmc3 = encryptTimestamp(tm3, password)
    const url3 = `https://www.fftt.com/mobile/pxml/xml_classement.php?serie=${serie}&tm=${tm3}&tmc=${tmc3}&id=${appId}&licence=8315151`
    const res3 = await fetch(url3, { cache: 'no-store' })
    const xml3 = await res3.text()
    
    results.xml_classement = {
      status: res3.status,
      hasError: xml3.includes('<erreur>'),
      errorMsg: xml3.match(/<erreur>([^<]*)<\/erreur>/)?.[1],
      sample: xml3.substring(0, 1000)
    }
  } catch (e: any) {
    results.xml_classement = { error: e.message }
  }

  // Test 4: xml_liste_joueur_o (SPID)
  try {
    const tm4 = generateTimestamp()
    const tmc4 = encryptTimestamp(tm4, password)
    const url4 = `https://www.fftt.com/mobile/pxml/xml_liste_joueur_o.php?serie=${serie}&tm=${tm4}&tmc=${tmc4}&id=${appId}&club=${clubId}`
    const res4 = await fetch(url4, { cache: 'no-store' })
    const xml4 = await res4.text()
    
    const firstJoueur4 = xml4.match(/<joueur>[\s\S]*?<\/joueur>/)?.[0] || ''
    results.xml_liste_joueur_o = {
      status: res4.status,
      hasError: xml4.includes('<erreur>'),
      errorMsg: xml4.match(/<erreur>([^<]*)<\/erreur>/)?.[1],
      sample: firstJoueur4,
      fields: firstJoueur4 ? {
        licence: firstJoueur4.match(/<licence>([^<]*)<\/licence>/)?.[1],
        nom: firstJoueur4.match(/<nom>([^<]*)<\/nom>/)?.[1],
        prenom: firstJoueur4.match(/<prenom>([^<]*)<\/prenom>/)?.[1],
        point: firstJoueur4.match(/<point>([^<]*)<\/point>/)?.[1],
        apts: firstJoueur4.match(/<apts>([^<]*)<\/apts>/)?.[1],
        clast: firstJoueur4.match(/<clast>([^<]*)<\/clast>/)?.[1]
      } : null
    }
  } catch (e: any) {
    results.xml_liste_joueur_o = { error: e.message }
  }

  return NextResponse.json({
    success: true,
    message: 'Test des différents endpoints FFTT',
    results,
    config: {
      appId,
      seriePrefix: serie.substring(0, 5) + '...'
    }
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
