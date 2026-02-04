import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

interface PlayerProgression {
  id: string
  licence: string
  nom: string
  prenom: string
  pointsActuels: number
  pointsAnciens: number
  pointsInitiaux: number
  progressionMois: number
  progressionSaison: number
  progressionPourcentage: number
  categorie: string | null
  palierAtteint?: number
}

interface Stats {
  recordMois: PlayerProgression | null
  enProgression: number
  enRegression: number
  stables: number
  total: number
  nouveauxPaliers: PlayerProgression[]
}

export async function GET() {
  const supabase = await createClient()

  try {
    // Récupérer tous les joueurs du club avec leurs points
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('fftt_points_exact', { ascending: false, nullsFirst: false })

    if (error) throw error

    // Credentials SmartPing
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    let progressions: PlayerProgression[] = []
    let source = 'Données locales'
    let ffttAvailable = false

    // Utiliser d'abord les données locales (stockées par sync-joueurs)
    progressions = (players || []).map(player => {
      const pointsActuels = player.fftt_points_exact || player.fftt_points || 500
      const pointsAnciens = player.fftt_points_ancien || pointsActuels
      const pointsInitiaux = player.fftt_points_initial || pointsActuels
      
      const progressionMois = pointsActuels - pointsAnciens
      const progressionSaison = pointsActuels - pointsInitiaux
      const progressionPourcentage = pointsInitiaux > 0 
        ? Math.round((progressionSaison / pointsInitiaux) * 1000) / 10 
        : 0

      return {
        id: player.id,
        licence: player.smartping_licence,
        nom: player.last_name,
        prenom: player.first_name,
        pointsActuels,
        pointsAnciens,
        pointsInitiaux,
        progressionMois,
        progressionSaison,
        progressionPourcentage,
        categorie: player.fftt_category || player.category
      }
    })

    // Si FFTT disponible, enrichir avec données live pour les top 30
    if (appId && password && serie) {
      try {
        // Test rapide si FFTT est disponible
        const tm = generateTimestamp()
        const tmc = encryptTimestamp(tm, password)
        
        const testResponse = await fetch(
          `https://www.fftt.com/mobile/pxml/xml_liste_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&club=13830083`,
          { cache: 'no-store' }
        )
        const testXml = await testResponse.text()
        ffttAvailable = testResponse.status === 200 && !testXml.includes('<erreur>')
        
        if (ffttAvailable) {
          source = 'FFTT + Données locales'
          
          // Enrichir les top 30 joueurs avec données live via xml_joueur.php
          const top30 = progressions.slice(0, 30)
          
          for (let i = 0; i < top30.length; i++) {
            const player = top30[i]
            try {
              const tm2 = generateTimestamp()
              const tmc2 = encryptTimestamp(tm2, password)
              
              // Utiliser xml_joueur.php qui fonctionne (comme la version PHP)
              const response = await fetch(
                `https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&licence=${player.licence}`,
                { cache: 'no-store' }
              )
              const xml = await response.text()
              
              if (!xml.includes('<erreur>') && xml.includes('<joueur>')) {
                // point = points mensuels actuels
                // apoint = anciens points mensuels
                // valinit = valeur initiale
                const point = extractValue(xml, 'point')
                const pointm = extractValue(xml, 'pointm') || point
                const apoint = extractValue(xml, 'apoint')
                const apointm = extractValue(xml, 'apointm') || apoint
                const valinit = extractValue(xml, 'valinit')
                
                const pointsActuels = parseFloat(point || pointm || '0')
                const pointsAnciens = parseFloat(apointm || apoint || point || '0')
                // valinit est la valeur du début de saison
                const pointsInitiaux = parseFloat(valinit || '') || player.pointsInitiaux
                
                if (pointsActuels > 0) {
                  progressions[i] = {
                    ...player,
                    pointsActuels,
                    pointsAnciens,
                    pointsInitiaux,
                    progressionMois: Math.round(pointsActuels - pointsAnciens),
                    progressionSaison: Math.round(pointsActuels - pointsInitiaux),
                    progressionPourcentage: pointsInitiaux > 0 
                      ? Math.round(((pointsActuels - pointsInitiaux) / pointsInitiaux) * 1000) / 10 
                      : 0
                  }

                  // Mettre à jour en base
                  await supabase
                    .from('players')
                    .update({
                      fftt_points_exact: pointsActuels,
                      fftt_points: pointsActuels,
                      fftt_points_ancien: pointsAnciens,
                      fftt_points_initial: pointsInitiaux || player.pointsInitiaux,
                      last_sync: new Date().toISOString()
                    })
                    .eq('smartping_licence', player.licence)
                }
              }
            } catch {
              // Garder les données locales en cas d'erreur
            }
          }
        }
      } catch {
        ffttAvailable = false
      }
    }

    // Re-trier après enrichissement
    progressions.sort((a, b) => b.pointsActuels - a.pointsActuels)

    // Top progressions du mois
    const topMois = [...progressions]
      .filter(p => p.progressionMois !== 0)
      .sort((a, b) => b.progressionMois - a.progressionMois)
      .slice(0, 20)

    // Top progressions de la saison
    const topSaison = [...progressions]
      .filter(p => p.progressionSaison !== 0)
      .sort((a, b) => b.progressionSaison - a.progressionSaison)
      .slice(0, 20)
    
    // Stats
    const enProgression = progressions.filter(p => p.progressionMois > 0).length
    const enRegression = progressions.filter(p => p.progressionMois < 0).length
    const stables = progressions.filter(p => p.progressionMois === 0).length
    const recordMois = topMois[0] || null

    // Nouveaux paliers atteints cette saison
    const paliers = [500, 1000, 1500, 2000, 2500, 3000]
    const nouveauxPaliers = progressions
      .filter(p => p.pointsInitiaux > 0 && paliers.some(palier => 
        p.pointsActuels >= palier && p.pointsInitiaux < palier
      ))
      .map(p => ({
        ...p,
        palierAtteint: paliers.find(palier => p.pointsActuels >= palier && p.pointsInitiaux < palier)
      }))
      .sort((a, b) => (b.palierAtteint || 0) - (a.palierAtteint || 0))

    return NextResponse.json({
      topMois,
      topSaison,
      tous: progressions,
      stats: {
        recordMois,
        enProgression,
        enRegression,
        stables,
        total: progressions.length,
        nouveauxPaliers
      } as Stats,
      lastUpdate: new Date().toISOString(),
      source,
      ffttStatus: ffttAvailable ? 'Disponible' : 'Données locales uniquement'
    })

  } catch (error: any) {
    console.error('Erreur API progressions:', error)
    return NextResponse.json({ 
      topMois: [],
      topSaison: [],
      tous: [],
      stats: { recordMois: null, enProgression: 0, enRegression: 0, stables: 0, total: 0, nouveauxPaliers: [] },
      lastUpdate: new Date().toISOString(),
      source: 'Erreur',
      error: error.message 
    })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1] : null
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
