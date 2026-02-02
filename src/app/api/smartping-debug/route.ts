import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Route de diagnostic pour vérifier la configuration SmartPing
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''

  // Vérifier si les variables sont définies
  const diagnostics = {
    appId: {
      defined: !!appId,
      value: appId ? `${appId.substring(0, 2)}***` : 'NON DÉFINI',
      length: appId.length
    },
    password: {
      defined: !!password,
      value: password ? `${password.substring(0, 3)}***` : 'NON DÉFINI',
      length: password.length
    },
    serie: {
      defined: !!serie,
      value: serie ? `${serie.substring(0, 5)}***` : 'NON DÉFINI (normal si pas encore initialisé)',
      length: serie.length
    }
  }

  // Si les credentials sont définis, tester l'API
  let testResult = null
  if (appId && password) {
    try {
      // Générer une série de test
      const testSerie = generateSerie()
      const tm = generateTimestamp()
      const tmc = encryptTimestamp(tm, password)

      // Log pour debug
      console.log('=== SmartPing Debug ===')
      console.log('App ID:', appId)
      console.log('Password length:', password.length)
      console.log('Test Serie:', testSerie)
      console.log('Timestamp:', tm)
      console.log('Encrypted:', tmc)

      // Tester l'initialisation
      const url = `https://www.fftt.com/mobile/pxml/xml_initialisation.php?serie=${testSerie}&tm=${tm}&tmc=${tmc}&id=${appId}`
      
      const response = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'TLSTT-NextJS/1.0'
        }
      })
      const xmlText = await response.text()

      testResult = {
        url: url.replace(password, '***').replace(tmc, 'TMC***'),
        httpStatus: response.status,
        xmlResponse: xmlText,
        testSerie,
        timestamp: tm,
        encryptedTimestamp: tmc.substring(0, 10) + '...'
      }
    } catch (error: any) {
      testResult = {
        error: error.message
      }
    }
  }

  return NextResponse.json({
    message: 'Diagnostic SmartPing',
    diagnostics,
    testResult,
    expectedValues: {
      appId: 'SX044',
      passwordLength: 10,
      hint: 'Vérifiez que SMARTPING_APP_ID=SX044 et SMARTPING_PASSWORD=P23GaC6gaU sont bien définis dans Vercel'
    }
  }, { status: 200 })
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
