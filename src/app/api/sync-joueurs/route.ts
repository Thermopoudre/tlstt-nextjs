import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { smartPingAPI } from '@/lib/smartping/api'

export const maxDuration = 60

// Synchronise le roster des joueurs depuis l'API FFTT.
// IMPORTANT : pour le compte SX044, seul xml_liste_joueur.php est autorisé
// (xml_joueur/xml_licence_b renvoient "Compte incorrect"). On fait donc UN SEUL
// appel en masse (rapide, pas de timeout) et on met à jour roster + noms + échelon,
// SANS écraser les points exacts déjà présents en base.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  // Client service-role : indispensable pour écrire (les crons n'ont pas de session admin -> RLS bloquerait)
  const supabase = createAdminClient()
  const appId = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const clubId = '13830083'

  if (!appId || !password) {
    return NextResponse.json({ success: false, error: 'Variables SmartPing manquantes' }, { status: 400 })
  }

  try {
    // 1. Un seul appel en masse (endpoint autorisé)
    const listeXml = await smartPingAPI.getJoueurs(clubId)
    if (listeXml.includes('<erreur>')) {
      const error = listeXml.match(/<erreur>([^<]*)<\/erreur>/)?.[1] || 'Erreur FFTT'
      return NextResponse.json({ success: false, error, step: 'xml_liste_joueur' }, { status: 502 })
    }

    const joueursFFTT = (listeXml.match(/<joueur>[\s\S]*?<\/joueur>/g) || [])
      .map(xml => {
        const clastRaw = extractValue(xml, 'clast')
        const clast = clastRaw && !isNaN(parseInt(clastRaw)) ? parseInt(clastRaw) : null
        return {
          licence: extractValue(xml, 'licence'),
          nom: extractValue(xml, 'nom'),
          prenom: extractValue(xml, 'prenom'),
          clast,
        }
      })
      .filter(j => j.licence && j.nom)

    if (joueursFFTT.length === 0) {
      return NextResponse.json({ success: false, error: 'Aucun joueur retourné par la FFTT' }, { status: 502 })
    }

    // 2. État actuel en base (1 requête)
    const { data: existingRows } = await supabase
      .from('players')
      .select('id, smartping_licence, fftt_points_exact')
    const existing = new Map((existingRows || []).map(r => [r.smartping_licence, r]))

    const now = new Date().toISOString()
    const toInsert: Record<string, unknown>[] = []
    const updates: { id: number; data: Record<string, unknown> }[] = []

    for (const j of joueursFFTT) {
      const category = j.clast !== null ? String(j.clast) : 'NC'
      const row = existing.get(j.licence!)
      if (row) {
        // Joueur existant : on rafraîchit nom/prénom/échelon, on PRÉSERVE les points exacts.
        const data: Record<string, unknown> = {
          first_name: j.prenom,
          last_name: j.nom,
          fftt_category: category,
          category,
          last_sync: now,
        }
        // Points seulement si absents (ne pas dégrader une vraie valeur par l'estimation échelon×100)
        if ((row.fftt_points_exact ?? 0) === 0 && j.clast !== null) {
          data.fftt_points = j.clast * 100
          data.fftt_points_exact = j.clast * 100
        }
        updates.push({ id: row.id, data })
      } else {
        // Nouveau joueur
        const estimate = j.clast !== null ? j.clast * 100 : 500
        toInsert.push({
          smartping_licence: j.licence,
          first_name: j.prenom,
          last_name: j.nom,
          fftt_category: category,
          category,
          fftt_points: estimate,
          fftt_points_exact: estimate,
          fftt_points_initial: estimate,
          fftt_points_ancien: estimate,
          last_sync: now,
          admin_notes: 'TLSTT - Sync API (liste)',
        })
      }
    }

    // 3. Inserts en masse
    let created = 0
    if (toInsert.length > 0) {
      const { error: insErr, count } = await supabase
        .from('players')
        .insert(toInsert, { count: 'exact' })
      if (insErr) console.warn('Insert joueurs:', insErr.message)
      else created = count || toInsert.length
    }

    // 4. Updates par lots parallèles (DB only, pas d'appel FFTT -> rapide)
    let updated = 0
    const BATCH = 25
    for (let i = 0; i < updates.length; i += BATCH) {
      const slice = updates.slice(i, i + BATCH)
      const results = await Promise.all(
        slice.map(u => supabase.from('players').update(u.data).eq('id', u.id))
      )
      updated += results.filter(r => !r.error).length
    }

    return NextResponse.json({
      success: true,
      message: 'Synchronisation roster terminée (xml_liste_joueur)',
      stats: { joueursFFTT: joueursFFTT.length, created, updated },
      note: 'Points exacts non synchronisés : xml_joueur non autorisé pour ce compte FFTT (à activer côté FFTT).',
      timestamp: now,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur sync-joueurs:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

function extractValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1].trim() : null
}
