import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Route pour synchroniser les joueurs depuis l'API FFTT
// Utilise xml_liste_joueur.php pour la liste, puis xml_joueur.php pour les points exacts
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
    // Récupérer la liste de tous les joueurs du club
    const tm1 = generateTimestamp()
    const tmc1 = encryptTimestamp(tm1, password)
    
    const listeUrl = `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm1}&tmc=${tmc1}&id=${appId}&club=${clubId}`
    
    console.log('📋 Récupération liste joueurs FFTT...')
    const listeResponse = await fetch(listeUrl, { cache: 'no-store' })
    const listeXml = await listeResponse.text()

    if (listeXml.includes('<erreur>')) {
      const error = listeXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1]
      return NextResponse.json({ success: false, error, step: 'liste_joueurs' }, { status: 400 })
    }

    // Parser les joueurs
    const joueurMatches = listeXml.match(/<joueur>[\s\S]*?<\/joueur>/g) || []
    
    const joueursFFTT = joueurMatches.map(xml => {
      const clastRaw = extractValue(xml, 'clast')
      const clast = clastRaw ? parseInt(clastRaw) : 5
      
      return {
        licence: extractValue(xml, 'licence'),
        nom: extractValue(xml, 'nom'),
        prenom: extractValue(xml, 'prenom'),
        club: extractValue(xml, 'club'),
        nclub: extractValue(xml, 'nclub'),
        clast: isNaN(clast) ? 5 : clast // Fallback à 5 (500 pts) si non numérique
      }
    }).filter(j => j.licence && j.nom)

    console.log(`📥 ${joueursFFTT.length} joueurs trouvés dans la base FFTT`)

    let updated = 0
    let created = 0
    let errors = 0
    let pointsExactsRecuperes = 0

    for (const joueur of joueursFFTT) {
      try {
        // Récupérer les points exacts via xml_joueur.php
        let pointsExact: number | null = null
        let anciensPoints: number | null = null
        let valeurInitiale: number | null = null
        let categorie: string | null = null
        let classementOfficiel: string | null = null
        let apiSuccess = false
        
        try {
          const tm = generateTimestamp()
          const tmc = encryptTimestamp(tm, password)
          const joueurUrl = `https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${joueur.licence}`
          
          const joueurResponse = await fetch(joueurUrl, { cache: 'no-store' })
          const joueurXml = await joueurResponse.text()
          
          if (!joueurXml.includes('<erreur>') && joueurXml.includes('<joueur>')) {
            apiSuccess = true
            
            // point = points mensuels actuels (ex: 1847)
            const point = extractValue(joueurXml, 'point')
            const apoint = extractValue(joueurXml, 'apoint')
            const valinit = extractValue(joueurXml, 'valinit')
            const cat = extractValue(joueurXml, 'cat')
            const claof = extractValue(joueurXml, 'claof')
            const clastXml = extractValue(joueurXml, 'clast')
            
            // Points mensuels actuels
            if (point && !isNaN(parseFloat(point)) && parseFloat(point) > 0) {
              pointsExact = parseFloat(point)
              pointsExactsRecuperes++
            }
            
            // Anciens points mensuels (mois precedent)
            if (apoint && !isNaN(parseFloat(apoint)) && parseFloat(apoint) > 0) {
              anciensPoints = parseFloat(apoint)
            }
            
            // Valeur initiale de saison (debut de saison)
            if (valinit && !isNaN(parseFloat(valinit)) && parseFloat(valinit) > 0) {
              valeurInitiale = parseFloat(valinit)
            }
            
            // Categorie
            if (cat) categorie = cat
            
            // Classement officiel
            if (claof) {
              classementOfficiel = claof
            } else if (clastXml) {
              classementOfficiel = clastXml
            }
          }
        } catch (detailErr: any) {
          console.warn(`⚠️ Impossible de recuperer details joueur ${joueur.licence}:`, detailErr.message)
        }
        
        // Fallback: utiliser clast * 100 si on n'a pas de points exacts
        if (!pointsExact) {
          pointsExact = joueur.clast * 100
        }

        // Determiner la categorie affichable
        let displayCategory = categorie
        if (!displayCategory && classementOfficiel) {
          displayCategory = classementOfficiel
        }
        if (!displayCategory && joueur.clast && !isNaN(joueur.clast)) {
          displayCategory = `${joueur.clast}`
        }
        if (!displayCategory) {
          displayCategory = 'NC'
        }

        // Verifier si le joueur existe
        const { data: existing } = await supabase
          .from('players')
          .select('id, fftt_points_exact, fftt_points_initial, fftt_points_ancien')
          .eq('smartping_licence', joueur.licence)
          .single()

        if (existing) {
          const updateData: any = {
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_points_exact: pointsExact,
            fftt_points: pointsExact,
            fftt_category: displayCategory,
            category: displayCategory,
            last_sync: new Date().toISOString()
          }
          
          // Toujours mettre a jour les anciens points si disponibles depuis l'API
          if (anciensPoints !== null) {
            updateData.fftt_points_ancien = anciensPoints
          } else if (apiSuccess && existing.fftt_points_ancien === 500) {
            // Si l'API n'a pas retourne d'anciens points mais la valeur en BDD est le defaut 500,
            // utiliser les points actuels comme anciens points (pas de progression)
            updateData.fftt_points_ancien = pointsExact
          }
          
          // Mettre a jour les points initiaux de saison
          if (valeurInitiale !== null) {
            // Si on a valinit depuis l'API, toujours l'utiliser
            updateData.fftt_points_initial = valeurInitiale
          } else if (apiSuccess && (existing.fftt_points_initial === 500 || !existing.fftt_points_initial)) {
            // Si la valeur initiale en BDD est le defaut 500, corriger avec les points actuels
            updateData.fftt_points_initial = pointsExact
          }
          
          await supabase.from('players').update(updateData).eq('id', existing.id)
          updated++
        } else {
          const playerData: any = {
            first_name: joueur.prenom,
            last_name: joueur.nom,
            smartping_licence: joueur.licence,
            fftt_points_exact: pointsExact,
            fftt_points: pointsExact,
            fftt_category: displayCategory,
            category: displayCategory,
            last_sync: new Date().toISOString(),
            fftt_points_initial: valeurInitiale || pointsExact,
            fftt_points_ancien: anciensPoints || pointsExact
          }
          
          await supabase.from('players').insert(playerData)
          created++
        }
      } catch (err: any) {
        console.error(`Erreur joueur ${joueur.licence}:`, err.message)
        errors++
      }
    }

    // Récupérer le Top 10 pour vérification
    const { data: top10 } = await supabase
      .from('players')
      .select('first_name, last_name, fftt_points_exact, fftt_category, smartping_licence')
      .order('fftt_points_exact', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      message: `✅ Synchronisation terminée avec points exacts`,
      stats: {
        joueursTotal: joueursFFTT.length,
        pointsExactsRecuperes,
        updated,
        created,
        errors
      },
      top10: top10?.map(p => ({
        nom: `${p.first_name} ${p.last_name}`,
        points: p.fftt_points_exact,
        categorie: p.fftt_category,
        licence: p.smartping_licence
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
