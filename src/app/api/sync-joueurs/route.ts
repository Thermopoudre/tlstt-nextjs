import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smartPingAPI } from '@/lib/smartping/api'

// Route pour synchroniser les joueurs depuis l'API FFTT
// Utilise xml_liste_joueur.php pour la liste, puis xml_joueur.php pour les points exacts
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }
  const supabase = await createClient()

  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const clubId = '13830083'

  if (!appId || !password) {
    return NextResponse.json({
      success: false,
      error: 'Variables SmartPing manquantes',
      config: { hasAppId: !!appId, hasPassword: !!password }
    }, { status: 400 })
  }

  try {
    // Récupérer la liste de tous les joueurs du club
    console.log('📋 Récupération liste joueurs FFTT...')
    const listeXml = await smartPingAPI.getJoueurs(clubId)

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
          const joueurXml = await smartPingAPI.getJoueurClassement(joueur.licence!)

          if (!joueurXml.includes('<erreur>') && joueurXml.includes('<joueur>')) {
            apiSuccess = true

            // point = points mensuels actuels (ex: 1847)
            const point = extractValue(joueurXml, 'point')
            const apoint = extractValue(joueurXml, 'apoint')
            const valinit = extractValue(joueurXml, 'valinit')
            const cat = extractValue(joueurXml, 'cat')
            const claof = extractValue(joueurXml, 'claof')
            const clastXml = extractValue(joueurXml, 'clast')

            // Points mensuels actuels (arrondi pour eviter les erreurs de precision float)
            if (point && !isNaN(parseFloat(point)) && parseFloat(point) > 0) {
              pointsExact = Math.round(parseFloat(point))
              pointsExactsRecuperes++
            }

            // Anciens points mensuels (mois precedent)
            if (apoint && !isNaN(parseFloat(apoint)) && parseFloat(apoint) > 0) {
              anciensPoints = Math.round(parseFloat(apoint))
            }

            // Valeur initiale de saison (debut de saison)
            if (valinit && !isNaN(parseFloat(valinit)) && parseFloat(valinit) > 0) {
              valeurInitiale = Math.round(parseFloat(valinit))
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
        } catch (detailErr: unknown) {
          const detailMsg = detailErr instanceof Error ? detailErr.message : 'Erreur inconnue'
          console.warn(`⚠️ Impossible de recuperer details joueur ${joueur.licence}:`, detailMsg)
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
          const updateData: Record<string, unknown> = {
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
          } else if (apiSuccess && (existing.fftt_points_ancien === null || existing.fftt_points_ancien === undefined)) {
            updateData.fftt_points_ancien = pointsExact
          }

          // Mettre a jour les points initiaux de saison
          if (valeurInitiale !== null) {
            updateData.fftt_points_initial = valeurInitiale
          } else if (apiSuccess && (existing.fftt_points_initial === null || !existing.fftt_points_initial)) {
            updateData.fftt_points_initial = pointsExact
          }

          await supabase.from('players').update(updateData).eq('id', existing.id)
          updated++
        } else {
          const playerData: Record<string, unknown> = {
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
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error(`Erreur joueur ${joueur.licence}:`, errMsg)
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur sync:', message)
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1].trim() : null
}
