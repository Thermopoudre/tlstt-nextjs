import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Collecte d'audience « maison ».
 *
 * Choix de conception (RGPD) : aucune donnée personnelle n'est enregistrée.
 * - pas de cookie, pas d'identifiant persistant ;
 * - l'adresse IP n'est jamais stockée : elle sert uniquement à calculer une
 *   empreinte (hash) mélangée au navigateur, à la date du jour et à un sel ;
 *   cette empreinte change chaque jour, donc personne n'est suivi dans la durée ;
 * - on note si le visiteur est connecté (membre / admin) mais jamais QUI.
 */

const SEL = process.env.AUDIENCE_SALT || process.env.CRON_SECRET || 'tlstt-audience'

const BOTS = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|node-fetch|vercel-screenshot|semrush|ahrefs|dataprovider|petalbot|gptbot|claudebot|ccbot/i

function empreinteDuJour(req: NextRequest, jour: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'inconnue'
  const ua = req.headers.get('user-agent') || 'inconnu'
  return createHash('sha256').update(`${ip}|${ua}|${jour}|${SEL}`).digest('hex').slice(0, 32)
}

function sourceDepuisReferent(referent: string | null, hote: string): string {
  if (!referent) return 'direct'
  try {
    const h = new URL(referent).hostname.replace(/^www\./, '')
    if (!h || h === hote.replace(/^www\./, '')) return 'direct'
    if (/google\./.test(h)) return 'google'
    if (/bing\./.test(h)) return 'bing'
    if (/duckduckgo/.test(h)) return 'duckduckgo'
    if (/facebook|fb\.|messenger/.test(h)) return 'facebook'
    if (/instagram/.test(h)) return 'instagram'
    if (/t\.co|twitter|x\.com/.test(h)) return 'twitter'
    if (/linkedin|lnkd/.test(h)) return 'linkedin'
    if (/youtube|youtu\.be/.test(h)) return 'youtube'
    if (/whatsapp/.test(h)) return 'whatsapp'
    if (/fftt\./.test(h)) return 'fftt'
    return h.slice(0, 60)
  } catch {
    return 'direct'
  }
}

function appareilDepuisUa(ua: string): 'mobile' | 'tablette' | 'ordinateur' {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablette'
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile'
  return 'ordinateur'
}

function nettoyerChemin(brut: unknown): string | null {
  if (typeof brut !== 'string' || !brut.startsWith('/')) return null
  // On ne garde jamais les paramètres d'URL (ils peuvent contenir des données personnelles)
  const chemin = brut.split('?')[0].split('#')[0]
  if (chemin.startsWith('/admin') || chemin.startsWith('/api')) return null
  return chemin.slice(0, 200)
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') || ''
    if (!ua || BOTS.test(ua)) return NextResponse.json({ ok: true, ignore: 'robot' })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: false }, { status: 400 })

    const chemin = nettoyerChemin(body.chemin)
    if (!chemin) return NextResponse.json({ ok: true, ignore: 'chemin' })

    const type = typeof body.type === 'string' && /^[a-z_-]{1,30}$/.test(body.type) ? body.type : 'page'
    const visiteur = ['anonyme', 'membre', 'admin'].includes(body.visiteur) ? body.visiteur : 'anonyme'

    const jour = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }) // AAAA-MM-JJ
    const hote = req.headers.get('host') || 'tlstt.fr'

    const { error } = await createAdminClient().from('audience_events').insert({
      jour,
      type,
      chemin,
      titre: typeof body.titre === 'string' ? body.titre.slice(0, 120) : null,
      source: sourceDepuisReferent(typeof body.referent === 'string' ? body.referent : null, hote),
      appareil: appareilDepuisUa(ua),
      visiteur,
      empreinte: empreinteDuJour(req, jour),
      nouvelle_visite: body.nouvelle_visite === true,
    })

    if (error) return NextResponse.json({ ok: false }, { status: 200 })
    return NextResponse.json({ ok: true })
  } catch {
    // La mesure d'audience ne doit jamais gêner la navigation
    return NextResponse.json({ ok: true })
  }
}
