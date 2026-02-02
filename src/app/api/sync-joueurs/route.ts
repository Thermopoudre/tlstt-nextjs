import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Route pour synchroniser les joueurs depuis l'API FFTT
// Utilise xml_liste_joueur.php qui retourne la liste avec le classement (clast)
// Les points exacts ne sont pas disponibles via l'API actuelle (xml_licence_b retourne "Compte incorrect")
// On utilise clast * 100 comme approximation des points
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
      // clast est le niveau de classement (5=500-599, 6=600-699, etc.)
      // On approxime les points à clast * 100
      const pointsApprox = clast * 100
      
      return {
        licence: extractValue(xml, 'licence'),
        nom: extractValue(xml, 'nom'),
        prenom: extractValue(xml, 'prenom'),
        club: extractValue(xml, 'club'),
        nclub: extractValue(xml, 'nclub'),
        clast: clast,
        pointsApprox: pointsApprox
      }
    }).filter(j => j.licence && j.nom)

    console.log(`📥 ${joueursFFTT.length} joueurs trouvés dans la base FFTT`)

    let updated = 0
    let created = 0
    let errors = 0

    for (const joueur of joueursFFTT) {
      try {
        // Préparer les données joueur
        // On utilise les points approximatifs basés sur clast
        const playerData = {
          first_name: joueur.prenom,
          last_name: joueur.nom,
          smartping_licence: joueur.licence,
          fftt_points_exact: joueur.pointsApprox,
          fftt_points: joueur.pointsApprox,
          fftt_category: `Classe ${joueur.clast}`,
          category: `C${joueur.clast}`,
          last_sync: new Date().toISOString()
        }

        // Vérifier si le joueur existe
        const { data: existing } = await supabase
          .from('players')
          .select('id, fftt_points_exact')
          .eq('smartping_licence', joueur.licence)
          .single()

        if (existing) {
          // Ne mettre à jour que si on n'a pas déjà des points différents
          // (pour préserver les valeurs manuellement corrigées)
          const updateData: any = {
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_category: `Classe ${joueur.clast}`,
            last_sync: new Date().toISOString()
          }
          
          // Mettre à jour les points seulement si ce sont des valeurs par défaut ou approximatives
          if (!existing.fftt_points_exact || existing.fftt_points_exact === 500 || 
              existing.fftt_points_exact % 100 === 0) {
            updateData.fftt_points_exact = joueur.pointsApprox
            updateData.fftt_points = joueur.pointsApprox
          }
          
          await supabase.from('players').update(updateData).eq('id', existing.id)
          updated++
        } else {
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
      .select('first_name, last_name, fftt_points_exact, fftt_category')
      .order('fftt_points_exact', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      message: `✅ Synchronisation terminée`,
      note: 'Points basés sur le classement FFTT (clast). Les points exacts ne sont pas disponibles via l\'API actuelle.',
      stats: {
        joueursTotal: joueursFFTT.length,
        updated,
        created,
        errors
      },
      top10: top10?.map(p => ({
        nom: `${p.first_name} ${p.last_name}`,
        points: p.fftt_points_exact,
        categorie: p.fftt_category
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
