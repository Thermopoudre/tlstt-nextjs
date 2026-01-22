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
  avatar?: string
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

    // Pour chaque joueur, calculer les progressions depuis les données SmartPing
    const progressions: PlayerProgression[] = []
    
    // Credentials SmartPing
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    // Si on a les credentials, enrichir avec données FFTT
    if (appId && password && serie) {
      const tm = generateTimestamp()
      const tmc = encryptTimestamp(tm, password)

      // Limiter à 50 joueurs pour éviter timeout
      const topPlayers = players?.slice(0, 50) || []

      const enrichedPromises = topPlayers.map(async (player) => {
        try {
          const response = await fetch(
            `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${player.smartping_licence}`,
            { cache: 'no-store' }
          )
          const xml = await response.text()
          
          const pointm = extractValue(xml, 'pointm')
          const apointm = extractValue(xml, 'apointm')
          const initm = extractValue(xml, 'initm')
          const cat = extractValue(xml, 'cat')

          const pointsActuels = parseInt(pointm || '0') || player.fftt_points_exact || player.fftt_points || 0
          const pointsAnciens = parseInt(apointm || '0') || pointsActuels
          const pointsInitiaux = parseInt(initm || '0') || pointsActuels

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
            categorie: cat || player.category
          }
        } catch {
          // En cas d'erreur, utiliser les données locales
          const points = player.fftt_points_exact || player.fftt_points || 0
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
      })

      const results = await Promise.all(enrichedPromises)
      progressions.push(...results)
    } else {
      // Sans credentials, utiliser données locales
      players?.forEach(player => {
        const points = player.fftt_points_exact || player.fftt_points || 0
        progressions.push({
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
        })
      })
    }

    // Calculer les stats
    const topMois = [...progressions].sort((a, b) => b.progressionMois - a.progressionMois).slice(0, 20)
    const topSaison = [...progressions].sort((a, b) => b.progressionSaison - a.progressionSaison).slice(0, 20)
    
    // Record du club (plus grosse progression du mois)
    const recordMois = topMois[0]
    
    // Joueurs en progression (progressionMois > 0)
    const enProgression = progressions.filter(p => p.progressionMois > 0).length
    const enRegression = progressions.filter(p => p.progressionMois < 0).length
    const stables = progressions.filter(p => p.progressionMois === 0).length

    // Nouveaux paliers (500, 1000, 1500, 2000)
    const paliers = [500, 1000, 1500, 2000]
    const nouveauxPaliers = progressions.filter(p => {
      return paliers.some(palier => 
        p.pointsActuels >= palier && p.pointsInitiaux < palier
      )
    }).map(p => ({
      ...p,
      palierAtteint: paliers.find(palier => p.pointsActuels >= palier && p.pointsInitiaux < palier)
    }))

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
      },
      lastUpdate: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur API progressions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1] : null
}

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

function encryptTimestamp(timestamp: string, password: string): string {
  const md5Key = crypto.createHash('md5').update(password).digest('hex')
  const hmac = crypto.createHmac('sha1', md5Key)
  hmac.update(timestamp)
  return hmac.digest('hex')
}
