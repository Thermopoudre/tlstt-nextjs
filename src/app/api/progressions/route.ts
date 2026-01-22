import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  try {
    // Récupérer tous les joueurs du club (sans appel FFTT)
    const { data: players, error } = await supabase
      .from('players')
      .select('id, smartping_licence, first_name, last_name, fftt_points, fftt_points_exact, category')
      .order('fftt_points_exact', { ascending: false, nullsFirst: false })

    if (error) throw error

    // Transformer en format pour la page
    const progressions = (players || []).map(player => {
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
    })

    // Stats
    const topMois = progressions.slice(0, 20)
    const topSaison = progressions.slice(0, 20)
    const recordMois = progressions[0] || null

    return NextResponse.json({
      topMois,
      topSaison,
      tous: progressions,
      stats: {
        recordMois,
        enProgression: 0,
        enRegression: 0,
        stables: progressions.length,
        total: progressions.length,
        nouveauxPaliers: []
      },
      lastUpdate: new Date().toISOString(),
      source: 'Données locales'
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
