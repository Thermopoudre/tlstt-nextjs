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
    // Récupérer tous les joueurs du club
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

    // Test rapide si FFTT est disponible (1 joueur test)
    if (appId && password && serie) {
      try {
        const tm = generateTimestamp()
        const tmc = encryptTimestamp(tm, password)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        
        const testResponse = await fetch(
          `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=8311494`,
          { signal: controller.signal, cache: 'no-store' }
        )
        clearTimeout(timeout)
        
        const testXml = await testResponse.text()
        ffttAvailable = testResponse.status === 200 && 
                        testXml.includes('<licence>') && 
                        !testXml.includes('<erreur>')
        
        if (ffttAvailable) {
          source = 'FFTT Live'
        }
      } catch {
        ffttAvailable = false
      }
    }

    // Si FFTT disponible, enrichir avec données live
    if (ffttAvailable && appId && password && serie) {
      const tm = generateTimestamp()
      const tmc = encryptTimestamp(tm, password)
      
      // Limiter à 50 joueurs pour éviter timeout
      const topPlayers = players?.slice(0, 50) || []

      const enrichedPromises = topPlayers.map(async (player) => {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 3000)
          
          const response = await fetch(
            `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${player.smartping_licence}`,
            { signal: controller.signal, cache: 'no-store' }
          )
          clearTimeout(timeout)
          const xml = await response.text()
          
          if (xml.includes('<erreur>')) {
            return createLocalProgression(player)
          }
          
          const pointm = extractValue(xml, 'pointm')
          const apointm = extractValue(xml, 'apointm')
          const initm = extractValue(xml, 'initm')
          const cat = extractValue(xml, 'cat')

          const pointsActuels = parseInt(pointm || '0') || player.fftt_points_exact || player.fftt_points || 500
          const pointsAnciens = parseInt(apointm || '0') || pointsActuels
          const pointsInitiaux = parseInt(initm || '0') || pointsActuels

          const progressionMois = pointsActuels - pointsAnciens
          const progressionSaison = pointsActuels - pointsInitiaux
          const progressionPourcentage = pointsInitiaux > 0 
            ? Math.round((progressionSaison / pointsInitiaux) * 1000) / 10 
            : 0

          // Mettre à jour Supabase avec les nouvelles données
          await supabase
            .from('players')
            .update({
              fftt_points_exact: pointsActuels,
              fftt_points: pointsActuels,
              category: cat || player.category,
              last_sync: new Date().toISOString()
            })
            .eq('id', player.id)

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
            categorie: cat || player.category
          }
        } catch {
          return createLocalProgression(player)
        }
      })

      const results = await Promise.all(enrichedPromises)
      progressions = results
    } else {
      // FFTT indisponible - utiliser données Supabase
      progressions = (players || []).map(player => createLocalProgression(player))
    }

    // Trier par progression mensuelle décroissante pour topMois
    const topMois = [...progressions]
      .sort((a, b) => b.progressionMois - a.progressionMois)
      .slice(0, 20)

    // Trier par progression saison décroissante pour topSaison
    const topSaison = [...progressions]
      .sort((a, b) => b.progressionSaison - a.progressionSaison)
      .slice(0, 20)
    
    // Record du club (plus grosse progression du mois)
    const recordMois = topMois[0] || null
    
    // Stats
    const enProgression = progressions.filter(p => p.progressionMois > 0).length
    const enRegression = progressions.filter(p => p.progressionMois < 0).length
    const stables = progressions.filter(p => p.progressionMois === 0).length

    // Nouveaux paliers (500, 1000, 1500, 2000)
    const paliers = [500, 1000, 1500, 2000, 2500]
    const nouveauxPaliers = progressions
      .filter(p => paliers.some(palier => 
        p.pointsActuels >= palier && p.pointsInitiaux < palier && p.pointsInitiaux > 0
      ))
      .map(p => ({
        ...p,
        palierAtteint: paliers.find(palier => p.pointsActuels >= palier && p.pointsInitiaux < palier)
      }))

    return NextResponse.json({
      topMois,
      topSaison,
      tous: progressions.sort((a, b) => b.pointsActuels - a.pointsActuels),
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
      ffttStatus: ffttAvailable ? 'Disponible' : 'Indisponible - Credentials à renouveler auprès de la FFTT'
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

function createLocalProgression(player: any): PlayerProgression {
  const points = player.fftt_points_exact || player.fftt_points || 500
  return {
    id: player.id,
    licence: player.smartping_licence,
    nom: player.last_name,
    prenom: player.first_name,
    pointsActuels: points,
    pointsAnciens: points,
    pointsInitiaux: points,
    progressionMois: 0,
    progressionSaison: 0,
    progressionPourcentage: 0,
    categorie: player.category
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
