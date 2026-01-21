import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  // Serie DOIT être fixe et initialisée une seule fois (via xml_initialisation.php)
  const serie = process.env.SMARTPING_SERIE || generateSerie()
  const clubId = '13830083' // TLSTT
  
  const status = {
    hasAppId: !!appId,
    hasPwd: !!password,
    hasSerie: !!process.env.SMARTPING_SERIE,
    appIdLength: appId.length,
    pwdLength: password.length,
    clubId,
  }
  
  if (!appId || !password) {
    return NextResponse.json({
      ...status,
      connectionStatus: 'NO_CREDENTIALS',
      message: 'Variables SMARTPING_APP_ID et SMARTPING_PASSWORD non configurées',
    })
  }

  // Générer les paramètres d'authentification
  const tm = generateTimestamp()
  const tmc = encryptTimestamp(tm, password)

  try {
    // Tester avec xml_licence_b.php
    const url = `http://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${clubId}`
    
    const response = await fetch(url, { cache: 'no-store' })
    const xmlText = await response.text()
    
    // Compter les joueurs/licenciés trouvés
    const joueurCount = (xmlText.match(/<licence>/g) || []).length / 2 // Divisé par 2 car <licence> apparaît aussi comme tag interne
    const hasError = xmlText.toLowerCase().includes('erreur') || xmlText.toLowerCase().includes('error')
    
    return NextResponse.json({
      ...status,
      connectionStatus: response.ok && !hasError ? 'OK' : 'FAILED',
      httpStatus: response.status,
      joueurCount: Math.floor(joueurCount),
      hasError,
      xmlPreview: xmlText.substring(0, 500),
      authParams: {
        serie: serie.substring(0, 5) + '...',
        tm,
        tmc: tmc.substring(0, 10) + '...',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      ...status,
      connectionStatus: 'ERROR',
      error: error.message,
    })
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
