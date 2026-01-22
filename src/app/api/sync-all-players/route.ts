import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// API pour synchroniser tous les joueurs avec les données FFTT
export async function GET() {
  const supabase = await createClient()

  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    if (!appId || !password || !serie) {
      return NextResponse.json({ error: 'Credentials SmartPing manquants' }, { status: 500 })
    }

    // Récupérer tous les joueurs
    const { data: players, error } = await supabase
      .from('players')
      .select('id, smartping_licence, first_name, last_name, fftt_points, fftt_points_exact')
      .order('fftt_points', { ascending: false })

    if (error) throw error

    const results = {
      total: players?.length || 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    }

    // Traiter par lots de 10 pour éviter les timeouts
    const batchSize = 10
    const batches = []
    for (let i = 0; i < (players?.length || 0); i += batchSize) {
      batches.push(players?.slice(i, i + batchSize) || [])
    }

    for (const batch of batches) {
      const tm = generateTimestamp()
      const tmc = encryptTimestamp(tm, password)

      const updates = await Promise.all(
        batch.map(async (player) => {
          try {
            const response = await fetch(
              `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${player.smartping_licence}`,
              { cache: 'no-store' }
            )
            const xml = await response.text()

            if (xml.includes('<erreur>')) {
              return { id: player.id, success: false, error: 'Joueur non trouvé' }
            }

            const pointm = extractValue(xml, 'pointm')
            const cat = extractValue(xml, 'cat')
            const echelon = extractValue(xml, 'echelon')
            const place = extractValue(xml, 'place')

            const pointsExact = parseInt(pointm || '0')
            const category = echelon === 'N' && place ? `N${place}` : cat

            // Mettre à jour dans Supabase
            const { error: updateError } = await supabase
              .from('players')
              .update({
                fftt_points_exact: pointsExact,
                fftt_points: pointsExact || player.fftt_points,
                category: category || player.category,
                last_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', player.id)

            if (updateError) {
              return { id: player.id, success: false, error: updateError.message }
            }

            return { 
              id: player.id, 
              licence: player.smartping_licence,
              name: `${player.first_name} ${player.last_name}`,
              success: true, 
              points: pointsExact 
            }
          } catch (err: any) {
            return { id: player.id, success: false, error: err.message }
          }
        })
      )

      updates.forEach(u => {
        if (u.success) results.updated++
        else results.errors++
        results.details.push(u)
      })

      // Petite pause entre les lots pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${results.updated} mis à jour, ${results.errors} erreurs`,
      results
    })

  } catch (error: any) {
    console.error('Erreur sync:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
