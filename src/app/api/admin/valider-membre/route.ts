import { NextRequest, NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

/**
 * Validation d'un membre par le secrétariat.
 *
 * En plus de passer la fiche en « validé », on confirme son adresse email.
 * Sans cela, une personne qui n'a pas cliqué le lien reçu à l'inscription
 * (spam, lien expiré, boîte peu consultée) ne peut jamais se connecter, même
 * validée par le club : c'est exactement ce qui bloquait quatre membres.
 *
 * Un email de bienvenue est envoyé via le serveur du club (Brevo) pour lui dire
 * que son accès est ouvert.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

function bienvenueHtml(prenom: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <div style="background:#0a0a0a;padding:24px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:22px;letter-spacing:1px;">TLSTT</h2>
    <p style="color:#888;margin:6px 0 0;font-size:12px;">Toulon La Seyne Tennis de Table</p>
  </div>
  <div style="padding:30px;">
    <h1 style="color:#1a1a2e;font-size:21px;margin:0 0 14px;">Votre espace membre est ouvert${prenom ? `, ${prenom}` : ''} !</h1>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Votre inscription vient d'être validée par le club. Vous pouvez dès maintenant vous connecter
      avec l'adresse email et le mot de passe choisis lors de votre inscription.
    </p>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 22px;">
      Vous y retrouverez le planning, les actualités du club, la boutique et les petites annonces entre membres.
    </p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${SITE_URL}/espace-membre" style="display:inline-block;background:#3b9fd8;color:#fff;padding:14px 34px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Accéder à mon espace</a>
    </div>
    <p style="color:#777;font-size:13px;line-height:1.6;margin:0;">
      Mot de passe oublié ? Sur le site, cliquez « Connexion » puis « Mot de passe oublié ? ».
    </p>
  </div>
  <div style="background:#0a0a0a;padding:18px;text-align:center;">
    <p style="color:#777;font-size:11px;margin:0;">À bientôt dans la salle !</p>
  </div>
</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const sb = await createReadOnlyClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data: admin } = await sb
      .from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
    if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

    const { memberId, prevenir = true } = await req.json()
    if (!memberId) return NextResponse.json({ error: 'memberId requis' }, { status: 400 })

    const service = createAdminClient()

    const { error: erreurProfil } = await service
      .from('member_profiles')
      .update({
        is_validated: true,
        role: 'member',
        membership_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
    if (erreurProfil) {
      return NextResponse.json({ error: erreurProfil.message }, { status: 400 })
    }

    // Adresse email confirmée d'office : le club a vérifié la personne.
    let emailMembre = ''
    let prenom = ''
    try {
      const { data: compte } = await service.auth.admin.getUserById(memberId)
      emailMembre = compte?.user?.email || ''
      if (compte?.user && !compte.user.email_confirmed_at) {
        await service.auth.admin.updateUserById(memberId, { email_confirm: true })
      }
      const { data: fiche } = await service
        .from('member_profiles').select('first_name').eq('id', memberId).single()
      prenom = fiche?.first_name || ''
    } catch (e) {
      console.error('[valider-membre] confirmation email impossible :', e)
    }

    let emailEnvoye = false
    if (prevenir && emailMembre) {
      const envoi = await sendEmail({
        to: emailMembre,
        subject: '[TLSTT] Votre espace membre est ouvert',
        html: bienvenueHtml(prenom),
      })
      emailEnvoye = envoi.success
      if (!envoi.success) console.error('[valider-membre] envoi impossible :', envoi.error)
    }

    return NextResponse.json({ success: true, emailEnvoye })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
