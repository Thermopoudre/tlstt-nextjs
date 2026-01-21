import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  const supabase = await createClient()

  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const clubId = '08830083' // TLSTT
    
    if (!appId || !password) {
      return NextResponse.json({ 
        error: 'Credentials SmartPing manquants',
        hasAppId: !!appId,
        hasPwd: !!password
      }, { status: 500 })
    }

    // Générer les paramètres d'authentification
    const serie = generateSerie()
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // Utiliser xml_licence_b.php qui retourne les infos complètes avec points mensuels
    const url = `http://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=${clubId}`
    
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

    // Parser XML - format xml_licence_b.php
    const joueurs: any[] = []
    const licenceMatches = xmlText.matchAll(/<licence>([\s\S]*?)<\/licence>/g)
    
    for (const match of licenceMatches) {
      const licenceXml = match[1]
      
      // Ne pas parser le tag <licence> interne (numéro de licence)
      if (!licenceXml.includes('<nom>')) continue
      
      const licence = licenceXml.match(/<licence>([^<]*)<\/licence>/)?.[1] || 
                      licenceXml.match(/<nolicence>([^<]*)<\/nolicence>/)?.[1] || ''
      const nom = licenceXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || ''
      const prenom = licenceXml.match(/<prenom>([^<]*)<\/prenom>/)?.[1] || ''
      const point = licenceXml.match(/<point>([^<]*)<\/point>/)?.[1] || '500'
      const pointm = licenceXml.match(/<pointm>([^<]*)<\/pointm>/)?.[1] || point
      const cat = licenceXml.match(/<cat>([^<]*)<\/cat>/)?.[1] || ''
      const sexe = licenceXml.match(/<sexe>([^<]*)<\/sexe>/)?.[1] || ''
      
      if (licence && nom) {
        joueurs.push({ licence, nom, prenom, point, pointm, cat, sexe })
      }
    }

    // Si xml_licence_b ne fonctionne pas, essayer xml_liste_joueur
    if (joueurs.length === 0) {
      const joueurMatches = xmlText.matchAll(/<joueur>([\s\S]*?)<\/joueur>/g)
      
      for (const match of joueurMatches) {
        const joueurXml = match[1]
        
        const licence = joueurXml.match(/<licence>([^<]*)<\/licence>/)?.[1] || ''
        const nom = joueurXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || ''
        const prenom = joueurXml.match(/<prenom>([^<]*)<\/prenom>/)?.[1] || ''
        const clast = joueurXml.match(/<clast>([^<]*)<\/clast>/)?.[1] || '500'
        
        if (licence && nom) {
          joueurs.push({ licence, nom, prenom, point: clast, pointm: clast, cat: '', sexe: '' })
        }
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

    for (const joueur of joueurs) {
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('smartping_licence', joueur.licence)
        .maybeSingle()

      const playerData = {
        first_name: joueur.prenom,
        last_name: joueur.nom,
        fftt_points: parseInt(joueur.point) || 500,
        fftt_points_exact: parseFloat(joueur.pointm) || parseInt(joueur.point) || 500,
        category: joueur.cat,
        admin_notes: 'TLSTT',
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        await supabase
          .from('players')
          .update(playerData)
          .eq('id', existing.id)
        updated++
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
      message: `✅ ${inserted} joueurs ajoutés, ${updated} mis à jour`
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Générer un numéro de série (15 caractères alphanumériques)
function generateSerie(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let serie = ''
  for (let i = 0; i < 15; i++) {
    serie += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return serie
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
