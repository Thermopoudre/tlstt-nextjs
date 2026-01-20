import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.SMARTPING_APP_ID || ''
  const pwd = process.env.SMARTPING_PASSWORD || ''
  const clubId = '08830083' // TLSTT
  
  const status = {
    hasAppId: !!appId,
    hasPwd: !!pwd,
    appIdLength: appId.length,
    pwdLength: pwd.length,
    clubId,
  }
  
  // Test de connexion à SmartPing
  if (appId && pwd) {
    try {
      const url = `https://www.smartping.com/smartping/xml_liste_joueur_o.php?appId=${appId}&pwd=${pwd}&club=${clubId}`
      const response = await fetch(url, { cache: 'no-store' })
      const xmlText = await response.text()
      
      // Compter les joueurs trouvés
      const joueurCount = (xmlText.match(/<joueur>/g) || []).length
      
      return NextResponse.json({
        ...status,
        connectionStatus: response.ok ? 'OK' : 'FAILED',
        httpStatus: response.status,
        joueurCount,
        xmlPreview: xmlText.substring(0, 300),
      })
    } catch (error: any) {
      return NextResponse.json({
        ...status,
        connectionStatus: 'ERROR',
        error: error.message,
      })
    }
  }
  
  return NextResponse.json({
    ...status,
    connectionStatus: 'NO_CREDENTIALS',
    message: 'Variables SMARTPING_APP_ID et SMARTPING_PASSWORD non configurées',
  })
}
