import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Route pour initialiser le numéro de série SmartPing
// A appeler UNE SEULE FOIS puis stocker la série dans SMARTPING_SERIE
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  
  if (!appId || !password) {
    return NextResponse.json({ 
      error: 'Credentials SmartPing manquants',
      hasAppId: !!appId,
      hasPwd: !!password
    }, { status: 500 })
  }

  // Générer un nouveau numéro de série (15 caractères alphanumériques)
  const serie = generateSerie()
  const tm = generateTimestamp()
  const tmc = encryptTimestamp(tm, password)

  try {
    // Appeler xml_initialisation.php pour valider le numéro de série
    const url = `http://www.fftt.com/mobile/pxml/xml_initialisation.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}`
    
    console.log('🔄 Initialisation SmartPing...')
    console.log('URL:', url.replace(tmc, '***'))
    
    const response = await fetch(url, { cache: 'no-store' })
    const xmlText = await response.text()
    
    console.log('📥 Réponse:', xmlText)
    
    // Vérifier si l'initialisation a réussi
    const appliMatch = xmlText.match(/<appli>([^<]*)<\/appli>/)
    const isAuthorized = appliMatch?.[1] === '1'
    
    if (isAuthorized) {
      return NextResponse.json({
        success: true,
        serie,
        message: `✅ Série initialisée avec succès ! Ajoutez SMARTPING_SERIE=${serie} dans vos variables d'environnement Vercel.`,
        xmlResponse: xmlText
      })
    } else {
      return NextResponse.json({
        success: false,
        serie,
        error: 'Initialisation refusée par l\'API FFTT',
        xmlResponse: xmlText
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Erreur init:', error)
    return NextResponse.json({ 
      error: error.message,
      serie 
    }, { status: 500 })
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
