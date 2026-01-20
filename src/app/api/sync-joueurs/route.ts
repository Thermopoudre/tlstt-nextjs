import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  try {
    // Appel direct à l'API SmartPing
    const appId = process.env.SMARTPING_APP_ID || ''
    const pwd = process.env.SMARTPING_PASSWORD || ''
    const clubId = '08830083' // TLSTT
    
    // Debug: vérifier les credentials
    if (!appId || !pwd) {
      return NextResponse.json({ 
        error: 'Credentials SmartPing manquants',
        hasAppId: !!appId,
        hasPwd: !!pwd
      }, { status: 500 })
    }
    
    const url = `https://www.smartping.com/smartping/xml_liste_joueur_o.php?appId=${appId}&pwd=${pwd}&club=${clubId}`
    
    console.log('🔄 Appel SmartPing API...')
    const response = await fetch(url, { cache: 'no-store' })
    const xmlText = await response.text()
    
    console.log('📥 Réponse SmartPing:', xmlText.substring(0, 200))
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Erreur HTTP SmartPing', 
        status: response.status,
        preview: xmlText.substring(0, 500)
      }, { status: 500 })
    }
    
    if (xmlText.includes('<error>') || xmlText.includes('erreur')) {
      return NextResponse.json({ 
        error: 'Erreur API SmartPing', 
        details: xmlText.substring(0, 500)
      }, { status: 500 })
    }

    // Parser XML basique
    const joueurs: any[] = []
    const joueurMatches = xmlText.matchAll(/<joueur>([\s\S]*?)<\/joueur>/g)
    
    for (const match of joueurMatches) {
      const joueurXml = match[1]
      
      const licence = joueurXml.match(/<licence>([^<]*)<\/licence>/)?.[1] || ''
      const nom = joueurXml.match(/<nom>([^<]*)<\/nom>/)?.[1] || ''
      const prenom = joueurXml.match(/<prenom>([^<]*)<\/prenom>/)?.[1] || ''
      const point = joueurXml.match(/<point>([^<]*)<\/point>/)?.[1] || '500'
      const cat = joueurXml.match(/<cat>([^<]*)<\/cat>/)?.[1] || ''
      
      if (licence && nom) {
        joueurs.push({ licence, nom, prenom, point, cat })
      }
    }

    console.log(`✅ ${joueurs.length} joueurs trouvés`)

    if (joueurs.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun joueur trouvé après parsing', 
        xmlPreview: xmlText.substring(0, 1000)
      }, { status: 404 })
    }

    let inserted = 0
    let updated = 0

    for (const joueur of joueurs) {
      // Vérifier si le joueur existe
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('smartping_licence', joueur.licence)
        .maybeSingle()

      if (existing) {
        // Mise à jour
        await supabase
          .from('players')
          .update({
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_points: parseInt(joueur.point) || 500,
            fftt_points_exact: parseFloat(joueur.point) || parseInt(joueur.point) || 500,
            category: joueur.cat,
            admin_notes: 'TLSTT',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        
        updated++
      } else {
        // Insertion
        const { error } = await supabase
          .from('players')
          .insert([{
            smartping_licence: joueur.licence,
            first_name: joueur.prenom,
            last_name: joueur.nom,
            fftt_points: parseInt(joueur.point) || 500,
            fftt_points_exact: parseFloat(joueur.point) || parseInt(joueur.point) || 500,
            category: joueur.cat,
            admin_notes: 'TLSTT',
          }])
        
        if (!error) inserted++
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
