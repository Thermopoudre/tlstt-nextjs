import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Route pour synchroniser TOUS les joueurs avec les points EXACTS de l'API FFTT
export async function GET() {
  const supabase = await createClient()

  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''
  const clubId = '13830083'

  if (!appId || !password || !serie) {
    return NextResponse.json({
      success: false,
      error: 'Variables SmartPing manquantes',
      config: { hasAppId: !!appId, hasPassword: !!password, hasSerie: !!serie }
    }, { status: 400 })
  }

  try {
    // Étape 1: Récupérer la liste des joueurs du club depuis FFTT
    const tm1 = generateTimestamp()
    const tmc1 = encryptTimestamp(tm1, password)
    
    const listeUrl = `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm1}&tmc=${tmc1}&id=${appId}&club=${clubId}`
    
    const listeResponse = await fetch(listeUrl, { cache: 'no-store' })
    const listeXml = await listeResponse.text()

    if (listeXml.includes('<erreur>')) {
      const error = listeXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1]
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    // Parser les joueurs du XML
    const joueurMatches = listeXml.match(/<licence>[\s\S]*?<\/licence>/g) || []
    
    const joueursFFTT = joueurMatches.map(xml => {
      return {
        licence: extractValue(xml, 'licence') || extractValue(xml, 'nolicence'),
        nom: extractValue(xml, 'nom'),
        prenom: extractValue(xml, 'prenom'),
        numclub: extractValue(xml, 'numclub'),
        sexe: extractValue(xml, 'sexe'),
        cat: extractValue(xml, 'cat'),
        // Points EXACTS mensuels
        pointm: parseInt(extractValue(xml, 'pointm') || '0'),
        // Points officiels (palier)
        point: parseInt(extractValue(xml, 'point') || '0'),
        // Anciens points mensuels
        apointm: parseInt(extractValue(xml, 'apointm') || '0'),
        // Valeur initiale saison
        initm: parseInt(extractValue(xml, 'initm') || '0'),
        echelon: extractValue(xml, 'echelon'),
        place: extractValue(xml, 'place')
      }
    }).filter(j => j.licence && j.nom)

    console.log(`📥 ${joueursFFTT.length} joueurs récupérés depuis FFTT`)

    // Étape 2: Mettre à jour chaque joueur dans Supabase
    let updated = 0
    let created = 0
    let errors = 0

    for (const joueur of joueursFFTT) {
      try {
        // Les points EXACTS sont dans pointm (points mensuels)
        const pointsExacts = joueur.pointm > 0 ? joueur.pointm : joueur.point

        // Vérifier si le joueur existe
        const { data: existing } = await supabase
          .from('players')
          .select('id')
          .eq('smartping_licence', joueur.licence)
          .single()

        const playerData = {
          first_name: joueur.prenom,
          last_name: joueur.nom,
          smartping_licence: joueur.licence,
          fftt_points_exact: pointsExacts, // Points EXACTS
          fftt_points: pointsExacts, // Aussi dans fftt_points pour compatibilité
          fftt_category: joueur.cat,
          category: joueur.echelon ? `N${joueur.place}` : joueur.cat,
          last_sync: new Date().toISOString()
        }

        if (existing) {
          // Mettre à jour
          await supabase
            .from('players')
            .update(playerData)
            .eq('id', existing.id)
          updated++
        } else {
          // Créer
          await supabase
            .from('players')
            .insert(playerData)
          created++
        }
      } catch (err) {
        console.error(`Erreur joueur ${joueur.licence}:`, err)
        errors++
      }
    }

    // Étape 3: Récupérer les joueurs mis à jour pour vérification
    const { data: playersAfter } = await supabase
      .from('players')
      .select('first_name, last_name, fftt_points_exact')
      .order('fftt_points_exact', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      message: `✅ Synchronisation terminée`,
      stats: {
        joueursFFTT: joueursFFTT.length,
        updated,
        created,
        errors
      },
      top10: playersAfter?.map(p => ({
        nom: `${p.first_name} ${p.last_name}`,
        points: p.fftt_points_exact
      })),
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur sync:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1].trim() : null
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
