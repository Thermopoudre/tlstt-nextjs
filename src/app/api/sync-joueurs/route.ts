import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  const supabase = await createClient()

  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    // Serie DOIT être fixe et initialisée une seule fois (via /api/smartping-init)
    const serie = process.env.SMARTPING_SERIE || ''
    const clubId = '13830083' // TLSTT
    
    if (!appId || !password) {
      return NextResponse.json({ 
        error: 'Credentials SmartPing manquants',
        hasAppId: !!appId,
        hasPwd: !!password
      }, { status: 500 })
    }
    
    if (!serie) {
      return NextResponse.json({ 
        error: 'SMARTPING_SERIE non configuré. Appelez /api/smartping-init pour obtenir un numéro de série.',
      }, { status: 500 })
    }

    // Générer les paramètres d'authentification
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // Utiliser xml_licence_b.php qui retourne les infos complètes avec points mensuels
    const url = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${clubId}`
    
    console.log('🔄 Appel SmartPing API...')
    console.log('URL:', url.replace(tmc, '***'))
    
    const response = await fetch(url, { cache: 'no-store' })
    const xmlText = await response.text()
    
    console.log('📥 Réponse SmartPing (200 premiers chars):', xmlText.substring(0, 200))
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Erreur HTTP SmartPing', 
        status: response.status,
        preview: xmlText.substring(0, 500)
      }, { status: 500 })
    }
    
    // Vérifier les erreurs dans la réponse
    if (xmlText.includes('<erreur>') || xmlText.toLowerCase().includes('error')) {
      return NextResponse.json({ 
        error: 'Erreur API SmartPing', 
        details: xmlText.substring(0, 500)
      }, { status: 500 })
    }

    // Parser XML - format xml_liste_joueur.php avec <joueur>
    const joueurs: any[] = []
    const joueurMatches = xmlText.matchAll(/<joueur>([\s\S]*?)<\/joueur>/g)
    
    for (const match of joueurMatches) {
      const joueurXml = match[1]
      
      const licence = joueurXml.match(/<licence>([^<]*)<\/licence>/)?.[1] || ''
      const nom = joueurXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || ''
      const prenom = joueurXml.match(/<prenom>([^<]*)<\/prenom>/)?.[1] || ''
      // clast = classement (ex: "5", "7", "NC", etc.)
      const clast = joueurXml.match(/<clast>([^<]*)<\/clast>/)?.[1] || ''
      
      // Extraire les points du classement (ex: "5" -> 500, "7" -> 700, "NC" -> 500)
      let points = 500
      if (clast && !isNaN(parseInt(clast))) {
        points = parseInt(clast) * 100 // Classement * 100 = points approximatifs
      }
      
      if (licence && nom) {
        joueurs.push({ licence, nom, prenom, points, clast })
      }
    }

    console.log(`✅ ${joueurs.length} joueurs trouvés`)

    if (joueurs.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun joueur trouvé après parsing', 
        xmlPreview: xmlText.substring(0, 1500)
      }, { status: 404 })
    }

    let inserted = 0
    let updated = 0
    const errors: { licence: string; error: string }[] = []

    for (const joueur of joueurs) {
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('smartping_licence', joueur.licence)
        .maybeSingle()

      const playerData = {
        first_name: joueur.prenom,
        last_name: joueur.nom,
        fftt_points: joueur.points,
        fftt_points_exact: joueur.points,
        category: joueur.clast, // Utiliser clast comme catégorie temporaire
        admin_notes: 'TLSTT - Sync API',
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', existing.id)
        if (!updateError) updated++
        else console.error('Update error:', updateError)
      } else {
        const { error } = await supabase
          .from('players')
          .insert([{
            smartping_licence: joueur.licence,
            ...playerData,
          }])
        if (!error) {
          inserted++
        } else {
          // Log first error for debugging
          if (errors.length < 5) errors.push({ licence: joueur.licence, error: error.message })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      total: joueurs.length,
      inserted,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `✅ ${inserted} joueurs ajoutés, ${updated} mis à jour`
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Générer le timestamp au format YYYYMMDDHHMMSSmmm
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

// Crypter le timestamp avec HMAC-SHA1
function encryptTimestamp(timestamp: string, password: string): string {
  // 1. MD5 du mot de passe
  const md5Key = crypto.createHash('md5').update(password).digest('hex')
  
  // 2. HMAC-SHA1 du timestamp avec la clé MD5
  const hmac = crypto.createHmac('sha1', md5Key)
  hmac.update(timestamp)
  return hmac.digest('hex')
}
