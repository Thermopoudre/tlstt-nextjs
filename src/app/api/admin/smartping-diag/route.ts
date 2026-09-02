import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { estAppelAutorise } from '@/lib/api-auth'

/**
 * Diagnostic de l'API SmartPing (FFTT) — réservé aux administrateurs.
 *
 * Teste chaque script de la spécification 2.0 avec une série initialisée
 * via xml_initialisation.php, et rend pour chacun : statut HTTP, taille de la
 * réponse, premières balises. Permet de distinguer « permission refusée par la
 * FFTT » d'une erreur de notre côté (série, timestamp, paramètres).
 *
 * GET /api/admin/smartping-diag?licence=8311494
 */

const BASE = 'https://www.fftt.com/mobile/pxml'
const CLUB = '13830083'

function timestamp(): string {
  const n = new Date()
  const p = (x: number, l = 2) => x.toString().padStart(l, '0')
  return `${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}${p(n.getMilliseconds(), 3)}`
}

function serieAleatoire(): string {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from(crypto.randomBytes(15), b => c[b % c.length]).join('')
}

export async function GET(req: NextRequest) {
  if (!(await estAppelAutorise(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const id = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serieEnv = process.env.SMARTPING_SERIE || ''
  const licence = req.nextUrl.searchParams.get('licence') || '8311494'

  if (!id || !password) {
    return NextResponse.json({ error: 'SMARTPING_APP_ID / SMARTPING_PASSWORD absents des variables d’environnement' }, { status: 500 })
  }

  const cle = crypto.createHash('md5').update(password).digest('hex')
  const appeler = async (script: string, params: Record<string, string>, serie: string) => {
    const tm = timestamp()
    const tmc = crypto.createHmac('sha1', cle).update(tm).digest('hex')
    const url = `${BASE}/${script}?${new URLSearchParams({ serie, tm, tmc, id, ...params })}`
    const t0 = Date.now()
    try {
      const r = await fetch(url, { cache: 'no-store' })
      const txt = await r.text()
      const balises = [...txt.matchAll(/<([a-z_]+)>/g)].map(m => m[1])
      const distinctes = [...new Set(balises)].slice(0, 12)
      const nb = (b: string) => (txt.match(new RegExp(`<${b}>`, 'g')) || []).length
      return {
        script, statut: r.status, ms: Date.now() - t0, octets: txt.length,
        balises: distinctes,
        occurrences: distinctes.length ? nb(distinctes[0]) : 0,
        extrait: txt.replace(/\s+/g, ' ').slice(0, 220),
      }
    } catch (e) {
      return { script, statut: 0, erreur: e instanceof Error ? e.message : String(e) }
    }
  }

  // 1) Série : celle de l'environnement si présente, sinon une nouvelle, initialisée
  const serie = serieEnv || serieAleatoire()
  const init = await appeler('xml_initialisation.php', {}, serie)

  // 2) Tous les scripts de la spec, avec la même série
  const tests: [string, Record<string, string>][] = [
    ['xml_club_detail.php', { club: CLUB }],
    ['xml_club_b.php', { numero: CLUB }],
    ['xml_equipe.php', { numclu: CLUB, type: 'A' }],
    ['xml_equipe.php', { numclu: CLUB }],
    ['xml_liste_joueur.php', { club: CLUB }],
    ['xml_liste_joueur_o.php', { club: CLUB, valid: '1' }],
    ['xml_licence_b.php', { club: CLUB }],
    ['xml_licence_b.php', { licence }],
    ['xml_licence.php', { licence }],
    ['xml_joueur.php', { licence }],
    ['xml_partie_mysql.php', { licence }],
    ['xml_partie.php', { numlic: licence }],
    ['xml_histo_classement.php', { numlic: licence }],
    ['xml_organisme.php', { type: 'D' }],
    ['xml_new_actu.php', {}],
  ]
  const resultats = []
  for (const [script, params] of tests) {
    resultats.push({ params, ...(await appeler(script, params, serie)) })
  }

  return NextResponse.json({
    contexte: {
      appId: id,
      serieSource: serieEnv ? 'variable d’environnement SMARTPING_SERIE' : 'générée pour ce diagnostic',
      serieLongueur: serie.length,
      licenceTestee: licence,
    },
    initialisation: init,
    resultats,
  })
}
