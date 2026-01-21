import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  const supabase = await createClient()

  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
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

    // ÉTAPE 1: Récupérer la liste des joueurs du club avec xml_licence_b.php
    // Cette API retourne les infos complètes avec points mensuels exacts
    const url = `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${clubId}`
    
    console.log('🔄 Appel SmartPing API xml_licence_b.php pour points exacts...')
    console.log('URL:', url.replace(tmc, '***'))
    
    const response = await fetch(url, { cache: 'no-store' })
    const xmlText = await response.text()
    
    console.log('📥 Réponse SmartPing (500 premiers chars):', xmlText.substring(0, 500))
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Erreur HTTP SmartPing', 
        status: response.status,
        preview: xmlText.substring(0, 500)
      }, { status: 500 })
    }
    
    // Vérifier les erreurs dans la réponse
    if (xmlText.includes('<erreur>') || xmlText.toLowerCase().includes('compte incorrect')) {
      return NextResponse.json({ 
        error: 'Erreur API SmartPing (identifiants invalides ou compte bloqué)', 
        details: xmlText.substring(0, 500)
      }, { status: 500 })
    }

    // Parser XML - format xml_licence_b.php avec <licence>
    const joueurs: any[] = []
    const licenceMatches = xmlText.matchAll(/<licence>([\s\S]*?)<\/licence>/g)
    
    for (const match of licenceMatches) {
      const licenceXml = match[1]
      
      // Extraire les champs
      const licence = licenceXml.match(/<licence>([^<]*)<\/licence>/)?.[1] || 
                      licenceXml.match(/<nolicence>([^<]*)<\/nolicence>/)?.[1] || ''
      const nom = licenceXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || ''
      const prenom = licenceXml.match(/<prenom>([^<]*)<\/prenom>/)?.[1] || ''
      const sexe = licenceXml.match(/<sexe>([^<]*)<\/sexe>/)?.[1] || ''
      const cat = licenceXml.match(/<cat>([^<]*)<\/cat>/)?.[1] || ''
      
      // Points exacts (priorité: pointm > point)
      const pointm = licenceXml.match(/<pointm>([^<]*)<\/pointm>/)?.[1] || ''
      const point = licenceXml.match(/<point>([^<]*)<\/point>/)?.[1] || ''
      
      // Classement national
      const echelon = licenceXml.match(/<echelon>([^<]*)<\/echelon>/)?.[1] || ''
      const place = licenceXml.match(/<place>([^<]*)<\/place>/)?.[1] || ''
      
      // Points exacts (pointm = points mensuels = valeur exacte actuelle)
      let pointsExact = 500
      if (pointm && !isNaN(parseFloat(pointm))) {
        pointsExact = parseFloat(pointm)
      } else if (point && !isNaN(parseFloat(point))) {
        pointsExact = parseFloat(point)
      }
      
      // Catégorie: Si classé national (echelon="N"), stocker "N{place}" sinon la catégorie d'âge
      let category = cat
      if (echelon === 'N' && place) {
        category = `N${place}` // Ex: "N506" pour le 506ème français
      }
      
      // Points arrondis (classement officiel: 500, 600, 700...)
      const pointsRounded = Math.floor(pointsExact / 100) * 100
      
      if (licence || nom) {
        joueurs.push({ 
          licence: licence || `TEMP_${nom}_${prenom}`, 
          nom, 
          prenom, 
          pointsExact,
          pointsRounded,
          category,
          sexe,
          echelon,
          place
        })
      }
    }

    console.log(`✅ ${joueurs.length} joueurs trouvés avec xml_licence_b`)

    // Si xml_licence_b ne fonctionne pas, fallback sur xml_liste_joueur
    if (joueurs.length === 0) {
      console.log('⚠️ Fallback sur xml_liste_joueur.php...')
      return await syncWithListeJoueur(supabase, appId, password, serie, clubId)
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
        fftt_points: joueur.pointsRounded, // Points arrondis (500, 600...)
        fftt_points_exact: joueur.pointsExact, // Points exacts (1823, etc.)
        category: joueur.category, // "N506" si classé national, sinon catégorie d'âge
        admin_notes: 'TLSTT - Sync API',
        last_sync: new Date().toISOString(),
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
      message: `✅ ${inserted} joueurs ajoutés, ${updated} mis à jour avec points exacts`,
      sample: joueurs.slice(0, 3).map(j => ({
        nom: j.nom,
        prenom: j.prenom,
        pointsExact: j.pointsExact,
        pointsRounded: j.pointsRounded,
        category: j.category
      }))
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Fallback: utiliser xml_liste_joueur.php si xml_licence_b ne fonctionne pas
async function syncWithListeJoueur(
  supabase: any, 
  appId: string, 
  password: string, 
  serie: string, 
  clubId: string
) {
  const tm = generateTimestamp()
  const tmc = encryptTimestamp(tm, password)
  
  const url = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${clubId}`
  
  console.log('🔄 Fallback: Appel xml_liste_joueur.php...')
  
  const response = await fetch(url, { cache: 'no-store' })
  const xmlText = await response.text()
  
  const joueurs: any[] = []
  const joueurMatches = xmlText.matchAll(/<joueur>([\s\S]*?)<\/joueur>/g)
  
  for (const match of joueurMatches) {
    const joueurXml = match[1]
    
    const licence = joueurXml.match(/<licence>([^<]*)<\/licence>/)?.[1] || ''
    const nom = joueurXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || ''
    const prenom = joueurXml.match(/<prenom>([^<]*)<\/prenom>/)?.[1] || ''
    const clast = joueurXml.match(/<clast>([^<]*)<\/clast>/)?.[1] || ''
    
    // clast * 100 = points approximatifs (fallback sans points exacts)
    let points = 500
    if (clast && !isNaN(parseInt(clast))) {
      points = parseInt(clast) * 100
    }
    
    if (licence && nom) {
      joueurs.push({ licence, nom, prenom, points, clast })
    }
  }

  if (joueurs.length === 0) {
    return NextResponse.json({ 
      error: 'Aucun joueur trouvé', 
      xmlPreview: xmlText.substring(0, 1500)
    }, { status: 404 })
  }

  let inserted = 0
  let updated = 0

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
      fftt_points_exact: joueur.points, // Pas de points exacts disponibles
      category: joueur.clast,
      admin_notes: 'TLSTT - Sync API (fallback)',
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from('players')
        .update(playerData)
        .eq('id', existing.id)
      if (!error) updated++
    } else {
      const { error } = await supabase
        .from('players')
        .insert([{
          smartping_licence: joueur.licence,
          ...playerData,
        }])
      if (!error) inserted++
    }
  }

  return NextResponse.json({ 
    success: true, 
    total: joueurs.length,
    inserted,
    updated,
    message: `⚠️ Fallback: ${inserted} ajoutés, ${updated} mis à jour (points arrondis uniquement)`
  })
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
  const md5Key = crypto.createHash('md5').update(password).digest('hex')
  const hmac = crypto.createHmac('sha1', md5Key)
  hmac.update(timestamp)
  return hmac.digest('hex')
}
