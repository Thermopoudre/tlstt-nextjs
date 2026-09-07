import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

/**
 * « Mot de passe oublié » — envoi par notre propre serveur d'emails (Brevo).
 *
 * Pourquoi ne pas utiliser l'envoi intégré de Supabase : son service d'emails
 * mutualisé est limité à quelques messages par heure pour tout le projet. Dès
 * que deux ou trois personnes demandent un lien le même jour, les suivantes
 * reçoivent « email rate limit exceeded » et ne peuvent plus se dépanner.
 *
 * Ici : Supabase génère seulement le lien sécurisé, et c'est le club qui envoie
 * le message, depuis contact@tlstt.fr, avec sa propre mise en forme.
 *
 * La réponse est toujours la même, que le compte existe ou non : cela évite de
 * révéler qui est inscrit sur le site.
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

function corpsHtml(lien: string, destination: 'membre' | 'admin'): string {
  const espace = destination === 'admin' ? "l'administration du site" : 'votre espace membre'
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <div style="background:#0a0a0a;padding:24px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:22px;letter-spacing:1px;">TLSTT</h2>
    <p style="color:#888;margin:6px 0 0;font-size:12px;">Toulon La Seyne Tennis de Table</p>
  </div>
  <div style="padding:30px;">
    <h1 style="color:#1a1a2e;font-size:21px;margin:0 0 14px;">Choisir un nouveau mot de passe</h1>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 22px;">
      Vous avez demandé à réinitialiser le mot de passe de ${espace}.
      Cliquez sur le bouton ci-dessous : vous pourrez choisir un nouveau mot de passe immédiatement.
    </p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${lien}" style="display:inline-block;background:#3b9fd8;color:#fff;padding:14px 34px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Choisir mon mot de passe</a>
    </div>
    <p style="color:#777;font-size:13px;line-height:1.6;margin:0;">
      Ce lien est valable une heure et ne peut servir qu'une fois.
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : votre mot de passe actuel reste valable.
    </p>
  </div>
  <div style="background:#0a0a0a;padding:18px;text-align:center;">
    <p style="color:#777;font-size:11px;margin:0;">Vous ne parvenez pas à cliquer ? Copiez cette adresse dans votre navigateur :</p>
    <p style="margin:6px 0 0;"><a href="${lien}" style="color:#3b9fd8;font-size:11px;word-break:break-all;">${lien}</a></p>
  </div>
</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  const reponseNeutre = NextResponse.json({
    ok: true,
    message: "Si un compte existe pour cette adresse, un email vient d'être envoyé.",
  })

  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'inconnue'
    if (!sousLaLimite(ip)) return reponseNeutre

    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()
    if (!EMAIL.test(email)) return reponseNeutre
    if (!sousLaLimite('email:' + email)) return reponseNeutre

    const espaceAdmin = body?.espace === 'admin'
    const redirectTo = `${SITE_URL}${espaceAdmin ? '/admin/definir-mot-de-passe' : '/mot-de-passe'}`

    const service = createAdminClient()
    const { data, error } = await service.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    // Compte inexistant : on répond exactement comme si tout allait bien.
    if (error || !data?.properties?.action_link) return reponseNeutre

    const envoi = await sendEmail({
      to: email,
      subject: '[TLSTT] Choisir un nouveau mot de passe',
      html: corpsHtml(data.properties.action_link, espaceAdmin ? 'admin' : 'membre'),
    })

    if (!envoi.success) {
      console.error('[mot-de-passe-oublie] envoi impossible :', envoi.error)
    }
    return reponseNeutre
  } catch (e) {
    console.error('[mot-de-passe-oublie] erreur inattendue :', e)
    return reponseNeutre
  }
}
