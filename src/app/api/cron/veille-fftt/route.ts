import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { estAppelAutorise } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getSmtpConfig } from '@/lib/email'

/**
 * Veille quotidienne sur les droits de l'API FFTT (SmartPing).
 *
 * Le club a demandé l'extension de ses habilitations : plutôt que d'y penser
 * chaque semaine, le site teste lui-même les interfaces et prévient par email
 * **le jour où la fédération ouvre un accès** (ou le referme).
 *
 * Aucun email tant que rien ne change : seule une différence déclenche un envoi.
 */

const BASE = 'https://www.fftt.com/mobile/pxml'
const CLUB = '13830083'
const LICENCE_TEST = '8311494'
const CLE_REGLAGE = 'fftt_droits_connus'

/** Interfaces suivies : celles demandées à la FFTT + celles déjà ouvertes. */
const INTERFACES: { script: string; params: Record<string, string>; libelle: string }[] = [
  { script: 'xml_liste_joueur.php', params: { club: CLUB }, libelle: "Effectif du club" },
  { script: 'xml_partie_mysql.php', params: { licence: LICENCE_TEST }, libelle: "Parties d'un joueur" },
  { script: 'xml_new_actu.php', params: {}, libelle: 'Actualités FFTT' },
  { script: 'xml_club_detail.php', params: { club: CLUB }, libelle: 'Détail du club' },
  { script: 'xml_equipe.php', params: { numclu: CLUB, type: 'A' }, libelle: 'Équipes du club' },
  { script: 'xml_result_equ.php', params: { action: 'classement', auto: '1', D1: '1' }, libelle: 'Classement de poule' },
  { script: 'xml_rencontre_equ.php', params: { poule: '1' }, libelle: "Rencontres d'une poule" },
  { script: 'xml_joueur.php', params: { licence: LICENCE_TEST }, libelle: "Classement détaillé d'un joueur" },
  { script: 'xml_licence_b.php', params: { club: CLUB }, libelle: 'Licenciés + classements' },
  { script: 'xml_histo_classement.php', params: { numlic: LICENCE_TEST }, libelle: 'Historique de classement' },
  { script: 'xml_organisme.php', params: { type: 'D' }, libelle: 'Organismes' },
  { script: 'xml_epreuve.php', params: { organisme: '1', type: 'E' }, libelle: 'Épreuves' },
  { script: 'xml_division.php', params: { organisme: '1', epreuve: '1', type: 'E' }, libelle: 'Divisions' },
  { script: 'xml_result_indiv.php', params: { action: 'poule', epr: '1', res_division: '1' }, libelle: 'Résultats individuels' },
  { script: 'xml_res_cla.php', params: { res_division: '1' }, libelle: 'Classement critérium' },
]

function timestampParis(): string {
  const n = new Date()
  const p = (x: number, l = 2) => x.toString().padStart(l, '0')
  const f = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const parts = Object.fromEntries(f.formatToParts(n).map(x => [x.type, x.value]))
  return `${parts.year}${parts.month}${parts.day}${parts.hour === '24' ? '00' : parts.hour}${parts.minute}${parts.second}${p(n.getMilliseconds(), 3)}`
}

export async function GET(req: NextRequest) {
  if (!(await estAppelAutorise(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const id = process.env.SMARTPING_APP_ID || ''
  const password = process.env.SMARTPING_PASSWORD || ''
  const serie = process.env.SMARTPING_SERIE || ''
  if (!id || !password || !serie) {
    return NextResponse.json({ error: 'Identifiants SmartPing absents' }, { status: 500 })
  }
  const cle = crypto.createHash('md5').update(password).digest('hex')

  const autorisees: string[] = []
  for (const i of INTERFACES) {
    const tm = timestampParis()
    const tmc = crypto.createHmac('sha1', cle).update(tm).digest('hex')
    const url = `${BASE}/${i.script}?${new URLSearchParams({ serie, tm, tmc, id, ...i.params })}`
    try {
      const r = await fetch(url, { cache: 'no-store' })
      const txt = await r.text()
      // Un refus se reconnaît à un 401 ou à une réponse 200 contenant
      // <autorisation><statut>0</statut> (« Compte incorrect »).
      const refus = r.status === 401 || /<statut>\s*0\s*<\/statut>/i.test(txt) || /compte incorrect/i.test(txt)
      if (!refus && r.status === 200) autorisees.push(i.script)
    } catch {
      // Réseau indisponible : on ne conclut rien pour cette interface.
    }
    await new Promise(r => setTimeout(r, 300)) // on ménage l'API fédérale
  }

  const service = createAdminClient()
  const { data: reglage } = await service
    .from('settings').select('setting_value').eq('setting_key', CLE_REGLAGE).single()

  const connues: string[] = (() => {
    try { return JSON.parse(reglage?.setting_value || '[]') } catch { return [] }
  })()

  const nouvelles = autorisees.filter(s => !connues.includes(s))
  const perdues = connues.filter(s => !autorisees.includes(s))

  // Mémorise l'état du jour
  await service.from('settings').upsert(
    { setting_key: CLE_REGLAGE, setting_value: JSON.stringify(autorisees.sort()) },
    { onConflict: 'setting_key' }
  )

  // Premier passage : on enregistre sans alerter.
  const premierPassage = !reglage
  let emailEnvoye = false

  if (!premierPassage && (nouvelles.length > 0 || perdues.length > 0)) {
    const smtp = await getSmtpConfig()
    const destinataire = smtp.adminEmail || smtp.from
    if (smtp.configured && destinataire) {
      const nom = (s: string) => INTERFACES.find(i => i.script === s)?.libelle || s
      const liste = (l: string[]) => l.map(s => `<li><strong>${nom(s)}</strong> <span style="color:#888">(${s})</span></li>`).join('')
      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#f4f4f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <div style="background:#0a0a0a;padding:22px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:20px;">TLSTT — Veille API FFTT</h2>
  </div>
  <div style="padding:28px;">
    ${nouvelles.length ? `<h1 style="color:#1a7a3a;font-size:20px;margin:0 0 12px;">Bonne nouvelle : la FFTT vient d'ouvrir ${nouvelles.length} accès</h1>
    <ul style="color:#333;font-size:15px;line-height:1.7;">${liste(nouvelles)}</ul>
    <p style="color:#444;font-size:15px;line-height:1.6;">Les pages Équipes et Compétitions peuvent maintenant être remplies : il suffit de lancer une synchronisation depuis le back-office (Admin → Équipes → Synchroniser).</p>` : ''}
    ${perdues.length ? `<h1 style="color:#b3261e;font-size:18px;margin:${nouvelles.length ? '22px' : '0'} 0 12px;">Attention : ${perdues.length} accès ne répond plus</h1>
    <ul style="color:#333;font-size:15px;line-height:1.7;">${liste(perdues)}</ul>` : ''}
    <p style="color:#777;font-size:13px;margin-top:22px;">Vérification automatique quotidienne des habilitations SmartPing du club (application ${id}).</p>
  </div>
</div></body></html>`
      const envoi = await sendEmail({
        to: destinataire,
        subject: nouvelles.length
          ? `[TLSTT] La FFTT a ouvert ${nouvelles.length} accès à l'API`
          : `[TLSTT] ${perdues.length} accès API ne répond plus`,
        html,
      })
      emailEnvoye = envoi.success
      if (!envoi.success) console.error('[veille-fftt] email non envoyé :', envoi.error)
    }
  }

  return NextResponse.json({
    ok: true,
    premierPassage,
    autorisees: autorisees.length,
    total: INTERFACES.length,
    nouvelles,
    perdues,
    emailEnvoye,
  })
}
