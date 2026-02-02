import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Route de TEST qui utilise la série EXISTANTE pour vérifier que l'API fonctionne
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''

  if (!appId || !password || !serie) {
    return NextResponse.json({
      success: false,
      error: 'Variables manquantes',
      config: {
        hasAppId: !!appId,
        hasPassword: !!password,
        hasSerie: !!serie
      }
    }, { status: 400 })
  }

  const tm = generateTimestamp()
  const tmc = encryptTimestamp(tm, password)

  try {
    // Test 1: Récupérer les infos du club TLSTT
    const clubUrl = `https://www.fftt.com/mobile/pxml/xml_club_detail.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=13830083`
    
    const clubResponse = await fetch(clubUrl, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'TLSTT-NextJS/1.0' }
    })
    const clubXml = await clubResponse.text()

    // Test 2: Récupérer la liste des joueurs
    const tm2 = generateTimestamp()
    const tmc2 = encryptTimestamp(tm2, password)
    const joueursUrl = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&club=13830083`
    
    const joueursResponse = await fetch(joueursUrl, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'TLSTT-NextJS/1.0' }
    })
    const joueursXml = await joueursResponse.text()

    // Compter les joueurs
    const joueurMatches = joueursXml.match(/<joueur>/g)
    const nombreJoueurs = joueurMatches ? joueurMatches.length : 0

    // Vérifier si erreur
    const hasError = clubXml.includes('<erreur>') || joueursXml.includes('<erreur>')
    const errorMessage = clubXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || 
                         joueursXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1]

    if (hasError) {
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: {
          clubResponse: clubXml.substring(0, 500),
          joueursResponse: joueursXml.substring(0, 500)
        }
      })
    }

    // Extraire le nom du club
    const nomClub = clubXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || 'Non trouvé'

    return NextResponse.json({
      success: true,
      message: '✅ API FFTT fonctionnelle !',
      club: {
        numero: '13830083',
        nom: nomClub
      },
      joueurs: {
        total: nombreJoueurs,
        message: `${nombreJoueurs} joueurs trouvés dans la base FFTT`
      },
      config: {
        appId: appId,
        seriePrefix: serie.substring(0, 5) + '...',
        timestamp: tm
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
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
