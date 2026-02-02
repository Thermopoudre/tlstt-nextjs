import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Route pour synchroniser les joueurs avec les points EXACTS de l'API FFTT
// Étape 1: Récupérer la liste des licences via xml_liste_joueur
// Étape 2: Pour chaque licence, appeler xml_licence_b pour obtenir les points mensuels exacts
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
    // ÉTAPE 1: Récupérer la liste de tous les joueurs du club
    const tm1 = generateTimestamp()
    const tmc1 = encryptTimestamp(tm1, password)
    
    // xml_liste_joueur fonctionne pour lister les joueurs
    const listeUrl = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm1}&tmc=${tmc1}&id=${appId}&club=${clubId}`
    
    console.log('📋 Récupération liste joueurs...')
    const listeResponse = await fetch(listeUrl, { cache: 'no-store' })
    const listeXml = await listeResponse.text()

    if (listeXml.includes('<erreur>')) {
      const error = listeXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1]
      return NextResponse.json({ success: false, error, step: 'liste_joueurs' }, { status: 400 })
    }

    // Parser les joueurs
    const joueurMatches = listeXml.match(/<joueur>[\s\S]*?<\/joueur>/g) || []
    
    const joueursBase = joueurMatches.map(xml => ({
      licence: extractValue(xml, 'licence'),
      nom: extractValue(xml, 'nom'),
      prenom: extractValue(xml, 'prenom'),
      club: extractValue(xml, 'club'),
      nclub: extractValue(xml, 'nclub'),
      clast: extractValue(xml, 'clast') // Classement palier (pas exact)
    })).filter(j => j.licence && j.nom)

    console.log(`📥 ${joueursBase.length} joueurs trouvés`)

    // ÉTAPE 2: Pour chaque joueur, récupérer les points EXACTS via xml_licence_b
    let updated = 0
    let created = 0
    let errors = 0
    const results: any[] = []

    // Traiter par lots de 10 pour éviter les timeouts
    const batchSize = 10
    for (let i = 0; i < joueursBase.length; i += batchSize) {
      const batch = joueursBase.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (joueur) => {
        try {
          // Nouveau timestamp pour chaque requête
          const tm = generateTimestamp()
          const tmc = encryptTimestamp(tm, password)
          
          // Appeler xml_licence_b avec le numéro de licence
          const licenceUrl = `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${joueur.licence}`
          
          const response = await fetch(licenceUrl, { cache: 'no-store' })
          const xml = await response.text()
          
          // Extraire les données
          let pointsExacts = 500
          let pointsAnciens = 500
          let pointsInitiaux = 500
          let categorie = joueur.clast
          
          if (!xml.includes('<erreur>') && xml.includes('<licence>')) {
            // Points mensuels EXACTS
            const pointm = extractValue(xml, 'pointm')
            const apointm = extractValue(xml, 'apointm')
            const initm = extractValue(xml, 'initm')
            const cat = extractValue(xml, 'cat')
            const echelon = extractValue(xml, 'echelon')
            const place = extractValue(xml, 'place')
            
            pointsExacts = parseInt(pointm || '0') || 500
            pointsAnciens = parseInt(apointm || '0') || pointsExacts
            pointsInitiaux = parseInt(initm || '0') || pointsExacts
            
            // Catégorie : N+place si national, sinon cat
            if (echelon === 'N' && place) {
              categorie = `N${place}`
            } else if (cat) {
              categorie = cat
            }
          }

          // Préparer les données joueur
          const playerData = {
            first_name: joueur.prenom,
            last_name: joueur.nom,
            smartping_licence: joueur.licence,
            fftt_points_exact: pointsExacts,
            fftt_points: pointsExacts,
            fftt_points_ancien: pointsAnciens,
            fftt_points_initial: pointsInitiaux,
            fftt_category: categorie,
            category: categorie,
            last_sync: new Date().toISOString()
          }

          // Vérifier si le joueur existe
          const { data: existing } = await supabase
            .from('players')
            .select('id')
            .eq('smartping_licence', joueur.licence)
            .single()

          if (existing) {
            await supabase.from('players').update(playerData).eq('id', existing.id)
            return { action: 'updated', ...playerData }
          } else {
            await supabase.from('players').insert(playerData)
            return { action: 'created', ...playerData }
          }
        } catch (err: any) {
          console.error(`Erreur ${joueur.licence}:`, err.message)
          return { action: 'error', licence: joueur.licence, error: err.message }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      for (const r of batchResults) {
        if (r.action === 'updated') updated++
        else if (r.action === 'created') created++
        else errors++
      }
      
      results.push(...batchResults)
      
      // Petit délai entre les lots
      if (i + batchSize < joueursBase.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Récupérer le Top 10 pour vérification
    const { data: top10 } = await supabase
      .from('players')
      .select('first_name, last_name, fftt_points_exact')
      .order('fftt_points_exact', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      message: `✅ Synchronisation terminée`,
      stats: {
        joueursTotal: joueursBase.length,
        updated,
        created,
        errors
      },
      top10: top10?.map(p => ({
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
