import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smartPingAPI } from '@/lib/smartping/api'

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

    let progressions: PlayerProgression[] = []
    let source = 'Données locales'
    let ffttAvailable = false

    // Utiliser d'abord les donnees locales (stockees par sync-joueurs)
    progressions = (players || []).map(player => {
      const pointsActuels = player.fftt_points_exact || player.fftt_points || 500

      const anciensRaw = player.fftt_points_ancien
      const initRaw = player.fftt_points_initial

      // Utiliser null/undefined check uniquement (500 est une vraie valeur possible)
      const anciensEstDefaut = anciensRaw === null || anciensRaw === undefined
      const initEstDefaut = initRaw === null || initRaw === undefined

      const pointsAnciens = anciensEstDefaut ? pointsActuels : anciensRaw
      const pointsInitiaux = initEstDefaut ? pointsActuels : initRaw

      const progressionMois = Math.round(pointsActuels - pointsAnciens)
      const progressionSaison = Math.round(pointsActuels - pointsInitiaux)
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
    if (appId && password) {
      try {
        const top30 = progressions.slice(0, 30)

        for (let i = 0; i < top30.length; i++) {
          const player = top30[i]
          try {
            const xml = await smartPingAPI.getJoueurClassement(player.licence)

            if (!xml.includes('<erreur>') && xml.includes('<joueur>')) {
              if (!ffttAvailable) {
                ffttAvailable = true
                source = 'FFTT + Données locales'
              }

              // point = points mensuels actuels
              const point = extractValue(xml, 'point')
              const pointm = extractValue(xml, 'pointm') || point
              const apoint = extractValue(xml, 'apoint')
              const apointm = extractValue(xml, 'apointm') || apoint
              const valinit = extractValue(xml, 'valinit')

              const pointsActuels = Math.round(parseFloat(point || pointm || '0'))
              const pointsAnciens = Math.round(parseFloat(apointm || apoint || point || '0'))
              // valinit est la valeur du début de saison
              const pointsInitiaux = Math.round(parseFloat(valinit || '') || 0) || player.pointsInitiaux

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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur API progressions:', message)
    return NextResponse.json({
      topMois: [],
      topSaison: [],
      tous: [],
      stats: { recordMois: null, enProgression: 0, enRegression: 0, stables: 0, total: 0, nouveauxPaliers: [] },
      lastUpdate: new Date().toISOString(),
      source: 'Erreur',
      error: message
    }, { status: 500 })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1] : null
}
