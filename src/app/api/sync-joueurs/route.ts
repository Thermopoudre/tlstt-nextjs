import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SmartPingAPI } from '@/lib/smartping/api'

export async function POST() {
  const supabase = await createClient()
  const api = new SmartPingAPI()

  try {
    // Récupérer les joueurs depuis l'API SmartPing
    const joueurs = await api.getJoueurs()

    if (!joueurs || joueurs.length === 0) {
      return NextResponse.json({ error: 'Aucun joueur trouvé' }, { status: 404 })
    }

    let inserted = 0
    let updated = 0

    for (const joueur of joueurs) {
      // Vérifier si le joueur existe
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('smartping_licence', joueur.licence)
        .single()

      if (existing) {
        // Mise à jour
        await supabase
          .from('players')
          .update({
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_points: parseInt(joueur.point) || 500,
            fftt_points_exact: parseFloat(joueur.pointm) || parseInt(joueur.point) || 500,
            category: joueur.cat,
            admin_notes: 'TLSTT',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        
        updated++
      } else {
        // Insertion
        await supabase
          .from('players')
          .insert([{
            smartping_licence: joueur.licence,
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_points: parseInt(joueur.point) || 500,
            fftt_points_exact: parseFloat(joueur.pointm) || parseInt(joueur.point) || 500,
            category: joueur.cat,
            admin_notes: 'TLSTT',
          }])
        
        inserted++
      }
    }

    return NextResponse.json({ 
      success: true, 
      total: joueurs.length,
      inserted,
      updated,
      message: `✅ ${inserted} joueurs ajoutés, ${updated} mis à jour`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
