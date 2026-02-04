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
      const clast = parseInt(extractValue(xml, 'clast') || '5')
      
      return {
        licence: extractValue(xml, 'licence'),
        nom: extractValue(xml, 'nom'),
        prenom: extractValue(xml, 'prenom'),
        club: extractValue(xml, 'club'),
        nclub: extractValue(xml, 'nclub'),
        clast: clast
      }
    }).filter(j => j.licence && j.nom)

    console.log(`📥 ${joueursFFTT.length} joueurs trouvés dans la base FFTT`)

    let updated = 0
    let created = 0
    let errors = 0
    let pointsExactsRecuperes = 0

    for (const joueur of joueursFFTT) {
      try {
        // Récupérer les points exacts via xml_joueur.php (comme le fait la version PHP)
        let pointsExact: number | null = null
        let pointsMensuel: number | null = null
        let anciensPoints: number | null = null
        let categorie: string | null = null
        let classementOfficiel: string | null = null
        
        try {
          const tm = generateTimestamp()
          const tmc = encryptTimestamp(tm, password)
          const joueurUrl = `https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${joueur.licence}`
          
          const joueurResponse = await fetch(joueurUrl, { cache: 'no-store' })
          const joueurXml = await joueurResponse.text()
          
          if (!joueurXml.includes('<erreur>')) {
            // Extraire les différentes valeurs de points
            // point = points mensuels actuels (ex: 1847)
            // pointm = points mensuels (alternative, parfois identique)
            // apoint = anciens points mensuels
            // clast = classement officiel (ex: 18)
            // valcla = valeur classement (500-3500)
            const point = extractValue(joueurXml, 'point')
            const pointm = extractValue(joueurXml, 'pointm') || point
            const apoint = extractValue(joueurXml, 'apoint')
            const cat = extractValue(joueurXml, 'cat')
            const clastXml = extractValue(joueurXml, 'clast')
            const claof = extractValue(joueurXml, 'claof')
            
            // Prendre les points mensuels (priorité à point, puis pointm)
            if (point && !isNaN(parseFloat(point))) {
              pointsExact = parseFloat(point)
              pointsExactsRecuperes++
            } else if (pointm && !isNaN(parseFloat(pointm))) {
              pointsExact = parseFloat(pointm)
              pointsExactsRecuperes++
            }
            
            // Points mensuels pour calcul progressions
            if (pointm && !isNaN(parseFloat(pointm))) {
              pointsMensuel = parseFloat(pointm)
            }
            
            // Anciens points pour calcul progression mensuelle
            if (apoint && !isNaN(parseFloat(apoint))) {
              anciensPoints = parseFloat(apoint)
            }
            
            // Catégorie (S = Sénior, etc.)
            if (cat) {
              categorie = cat
            }
            
            // Classement officiel
            if (claof) {
              classementOfficiel = claof
            } else if (clastXml) {
              classementOfficiel = clastXml
            }
          }
        } catch (detailErr: any) {
          console.warn(`⚠️ Impossible de récupérer détails joueur ${joueur.licence}:`, detailErr.message)
        }
        
        // Fallback: utiliser clast * 100 si on n'a pas de points exacts
        if (!pointsExact) {
          pointsExact = joueur.clast * 100
        }

        // Préparer les données joueur
        const playerData: any = {
          first_name: joueur.prenom,
          last_name: joueur.nom,
          smartping_licence: joueur.licence,
          fftt_points_exact: pointsExact,
          fftt_points: pointsExact, // Même valeur pour compatibilité
          fftt_category: categorie || `Classe ${joueur.clast}`,
          category: categorie || `C${joueur.clast}`,
          last_sync: new Date().toISOString()
        }
        
        // Ajouter les anciens points si disponibles (pour calcul progressions)
        if (anciensPoints !== null) {
          playerData.fftt_points_ancien = anciensPoints
        }

        // Vérifier si le joueur existe
        const { data: existing } = await supabase
          .from('players')
          .select('id, fftt_points_exact, fftt_points_initial')
          .eq('smartping_licence', joueur.licence)
          .single()

        if (existing) {
          // Toujours mettre à jour avec les dernières données FFTT
          const updateData: any = {
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_points_exact: pointsExact,
            fftt_points: pointsExact,
            fftt_category: categorie || `Classe ${joueur.clast}`,
            last_sync: new Date().toISOString()
          }
          
          // Mettre à jour les anciens points si disponibles
          if (anciensPoints !== null) {
            updateData.fftt_points_ancien = anciensPoints
          }
          
          // Sauvegarder les points initiaux si pas encore définis (pour calcul progression saison)
          if (!existing.fftt_points_initial && pointsExact) {
            updateData.fftt_points_initial = pointsExact
          }
          
          await supabase.from('players').update(updateData).eq('id', existing.id)
          updated++
        } else {
          // Définir les points initiaux pour les nouveaux joueurs
          playerData.fftt_points_initial = pointsExact
          
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
