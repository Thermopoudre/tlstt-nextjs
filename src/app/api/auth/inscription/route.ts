import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

/**
 * Création d'un compte membre / visiteur.
 *
 * Pourquoi ne pas laisser Supabase faire l'envoi : son service d'emails intégré
 * est plafonné à quelques messages par heure pour tout le projet. Un jour de
 * forte activité, la personne ne recevait jamais son email de confirmation et
 * se retrouvait avec un compte inutilisable.
 *
 * Ici, Supabase crée le compte et fabrique le lien de confirmation, mais
 * n'envoie rien : le message part par le serveur du club (Brevo), depuis
 * contact@tlstt.fr, avec la mise en forme du site.
 *
 * Le mot de passe n'est ni journalisé ni conservé : il est transmis tel quel à
 * Supabase qui seul le stocke, chiffré.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

const tentatives = new Map<string, { count: number; resetAt: number }>()
const LIMITE = 5
const FENETRE_MS = 15 * 60 * 1000

function sousLaLimite(cle: string): boolean {
  const maintenant = Date.now()
  const e = tentatives.get(cle)
  if (!e || maintenant > e.resetAt) {
    tentatives.set(cle, { count: 1, resetAt: maintenant + FENETRE_MS })
    return true
  }
  if (e.count >= LIMITE) return false
  e.count++
  return true
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function confirmationHtml(prenom: string, lien: string, estMembre: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <div style="background:#0a0a0a;padding:24px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:22px;letter-spacing:1px;">TLSTT</h2>
    <p style="color:#888;margin:6px 0 0;font-size:12px;">Toulon La Seyne Tennis de Table</p>
  </div>
  <div style="padding:30px;">
    <h1 style="color:#1a1a2e;font-size:21px;margin:0 0 14px;">Bienvenue${prenom ? ' ' + prenom : ''} !</h1>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Il ne reste qu'une étape : confirmez votre adresse email en cliquant sur le bouton ci-dessous.
    </p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${lien}" style="display:inline-block;background:#3b9fd8;color:#fff;padding:14px 34px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Confirmer mon adresse</a>
    </div>
    <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 8px;">
      ${estMembre
        ? "Votre demande d'accès membre sera ensuite validée par le secrétariat du club : vous recevrez un message dès que votre espace sera ouvert."
        : "Vous pourrez ensuite vous connecter avec l'adresse et le mot de passe choisis."}
    </p>
    <p style="color:#777;font-size:13px;line-height:1.6;margin:14px 0 0;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message : aucun compte ne sera utilisé.
    </p>
  </div>
  <div style="background:#0a0a0a;padding:18px;text-align:center;">
    <p style="color:#777;font-size:11px;margin:0 0 6px;">Le lien ne fonctionne pas ? Copiez cette adresse dans votre navigateur :</p>
    <p style="margin:0;"><a href="${lien}" style="color:#3b9fd8;font-size:11px;word-break:break-all;">${lien}</a></p>
  </div>
</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'inconnue'
    if (!sousLaLimite(ip)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const profil = body?.profil || {}

    if (!EMAIL.test(email)) {
      return NextResponse.json({ error: "L'adresse email n'est pas valide." }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 })
    }

    const service = createAdminClient()

    // Crée le compte (non confirmé) et fabrique le lien : aucun email n'est
    // envoyé par Supabase avec cette méthode.
    const { data, error } = await service.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: {
          first_name: String(profil.first_name || ''),
          last_name: String(profil.last_name || ''),
          phone: profil.phone ? String(profil.phone) : null,
          licence_fftt: profil.licence_fftt ? String(profil.licence_fftt) : null,
          newsletter_subscribed: profil.newsletter_subscribed !== false,
          role: profil.role === 'member' ? 'member' : 'visitor',
        },
        redirectTo: `${SITE_URL}/espace-membre`,
      },
    })

    if (error) {
      if (/already|registered|exist/i.test(error.message)) {
        return NextResponse.json({ error: 'COMPTE_EXISTANT' }, { status: 409 })
      }
      console.error('[inscription] création impossible :', error.message)
      return NextResponse.json({ error: "La création du compte a échoué. Réessayez dans un instant." }, { status: 400 })
    }

    const lien = data?.properties?.action_link
    if (!lien) {
      return NextResponse.json({ error: "La création du compte a échoué." }, { status: 400 })
    }

    const envoi = await sendEmail({
      to: email,
      subject: '[TLSTT] Confirmez votre inscription',
      html: confirmationHtml(String(profil.first_name || ''), lien, profil.role === 'member'),
    })
    if (!envoi.success) {
      console.error('[inscription] email de confirmation non envoyé :', envoi.error)
    }

    return NextResponse.json({ ok: true, emailEnvoye: envoi.success })
  } catch (e) {
    console.error('[inscription] erreur inattendue :', e)
    return NextResponse.json({ error: 'Une erreur est survenue. Réessayez dans un instant.' }, { status: 500 })
  }
}
