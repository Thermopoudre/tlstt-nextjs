import { NextRequest, NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

// POST : ajoute un administrateur ET crée son compte de connexion via une
// invitation par email (la personne définit elle-même son mot de passe).
function invitationHtml(nom: string, lien: string, compteExistant: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <div style="background:#0a0a0a;padding:24px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:22px;letter-spacing:1px;">TLSTT</h2>
    <p style="color:#888;margin:6px 0 0;font-size:12px;">Administration du site</p>
  </div>
  <div style="padding:30px;">
    <h1 style="color:#1a1a2e;font-size:21px;margin:0 0 14px;">Bonjour${nom ? ' ' + nom : ''},</h1>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${compteExistant
        ? "Vous avez désormais accès à l'administration du site du club. Utilisez le bouton ci-dessous pour définir (ou redéfinir) votre mot de passe."
        : "Vous venez de recevoir un accès à l'administration du site du club. Cliquez sur le bouton ci-dessous pour choisir votre mot de passe."}
    </p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${lien}" style="display:inline-block;background:#3b9fd8;color:#fff;padding:14px 34px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Définir mon mot de passe</a>
    </div>
    <p style="color:#777;font-size:13px;line-height:1.6;margin:0;">
      Ensuite, l'administration est accessible sur <a href="${SITE_URL}/admin" style="color:#3b9fd8;">${SITE_URL.replace('https://', '')}/admin</a>.
      Ce lien est valable une heure et ne sert qu'une fois.
    </p>
  </div>
  <div style="background:#0a0a0a;padding:18px;text-align:center;">
    <p style="color:#777;font-size:11px;margin:0;">Toulon La Seyne Tennis de Table</p>
  </div>
</div>
</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, name, role } = await request.json()
    const email = (rawEmail || '').trim().toLowerCase()
    if (!email || !name) {
      return NextResponse.json({ error: 'Email et nom sont requis.' }, { status: 400 })
    }

    // 1) Vérifier que l'appelant est bien un admin actif
    const supabase = await createReadOnlyClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }
    const { data: caller } = await supabase
      .from('admins')
      .select('id')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()
    if (!caller) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const admin = createAdminClient()

    // 2) Déjà administrateur ?
    const { data: existingAdmin } = await admin
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existingAdmin) {
      return NextResponse.json({ error: 'Cet email est déjà administrateur.' }, { status: 409 })
    }

    // 3) Insérer dans la table admins (autorisation d'accès au back-office)
    const { error: insErr } = await admin
      .from('admins')
      .insert({ email, name, role: role || 'admin', is_active: true })
    if (insErr) {
      return NextResponse.json({ error: "Erreur lors de l'ajout : " + insErr.message }, { status: 500 })
    }

    // 4) Créer le compte de connexion + envoyer l'invitation depuis le serveur
    //    d'emails du club (Brevo). L'envoi intégré de Supabase est plafonné à
    //    quelques messages par heure : une invitation pouvait ne jamais partir.
    let message = `Invitation envoyée à ${email}. La personne définit son mot de passe via le lien reçu, puis accède au back-office.`
    const redirectTo = `${SITE_URL}/admin/definir-mot-de-passe`

    const { data: lien, error: invErr } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo },
    })

    if (invErr || !lien?.properties?.action_link) {
      if (invErr && /already|registered|exist/i.test(invErr.message)) {
        // Compte déjà existant : on lui envoie un lien de définition de mot de passe.
        const { data: recup } = await admin.auth.admin.generateLink({
          type: 'recovery', email, options: { redirectTo },
        })
        if (recup?.properties?.action_link) {
          const envoi = await sendEmail({
            to: email,
            subject: '[TLSTT] Votre accès à l’administration du site',
            html: invitationHtml(name || '', recup.properties.action_link, true),
          })
          message = envoi.success
            ? `${email} avait déjà un compte : un lien pour accéder au back-office vient de lui être envoyé.`
            : `${email} avait déjà un compte : la personne peut se connecter avec son mot de passe habituel.`
        } else {
          message = `${email} a déjà un compte de connexion : la personne peut se connecter directement avec son mot de passe habituel.`
        }
      } else {
        message = `Administrateur ajouté, mais l'invitation n'a pas pu être créée (${invErr?.message || 'erreur inconnue'}). La personne pourra utiliser « Mot de passe oublié ».`
      }
    } else {
      const envoi = await sendEmail({
        to: email,
        subject: '[TLSTT] Votre accès à l’administration du site',
        html: invitationHtml(name || '', lien.properties.action_link, false),
      })
      if (!envoi.success) {
        console.error('[admins] invitation non envoyée :', envoi.error)
        message = `Administrateur ajouté, mais l'email d'invitation n'a pas pu partir. La personne peut utiliser « Mot de passe oublié » sur la page de connexion du back-office.`
      }
    }

    return NextResponse.json({ ok: true, message })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
