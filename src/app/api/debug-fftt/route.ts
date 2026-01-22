import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Debug endpoint pour vérifier les credentials FFTT
export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || 'NON_CONFIGURE'
  const password = process.env.SMARTPING_PASSWORD || 'NON_CONFIGURE'
  const serie = process.env.SMARTPING_SERIE || 'NON_CONFIGURE'

  // Vérifier si les credentials sont présents
  const credentialsStatus = {
    SMARTPING_APP_ID: appId !== 'NON_CONFIGURE' ? `CONFIGURE (${appId.substring(0, 4)}...)` : 'MANQUANT',
    SMARTPING_PASSWORD: password !== 'NON_CONFIGURE' ? 'CONFIGURE (caché)' : 'MANQUANT',
    SMARTPING_SERIE: serie !== 'NON_CONFIGURE' ? `CONFIGURE (${serie})` : 'MANQUANT'
  }

  // Tester une requête API simple si les credentials sont présents
  let apiTest = null
  if (appId !== 'NON_CONFIGURE' && password !== 'NON_CONFIGURE' && serie !== 'NON_CONFIGURE') {
    try {
      const tm = generateTimestamp()
      const tmc = encryptTimestamp(tm, password)
      
      // Tester avec Alexis DELCROIX (8311494)
      const url = `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=8311494`
      
      const response = await fetch(url, { cache: 'no-store' })
      const xml = await response.text()
      
      // Extraire les valeurs
      const pointm = extractValue(xml, 'pointm')
      const nom = extractValue(xml, 'nom')
      const prenom = extractValue(xml, 'prenom')
      const erreur = extractValue(xml, 'erreur')
      
      apiTest = {
        status: response.status,
        hasError: !!erreur,
        errorMessage: erreur,
        pointm: pointm || 'NON_TROUVE',
        nom: nom || 'NON_TROUVE',
        prenom: prenom || 'NON_TROUVE',
        xmlLength: xml.length,
        xmlPreview: xml.substring(0, 500)
      }
    } catch (err: any) {
      apiTest = {
        status: 'ERROR',
        errorMessage: err.message
      }
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    credentialsStatus,
    apiTest,
    instructions: apiTest === null 
      ? 'Configurez les variables d\'environnement SMARTPING_APP_ID, SMARTPING_PASSWORD et SMARTPING_SERIE dans les settings Vercel' 
      : null
  })
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1] : null
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
