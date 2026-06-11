import { NextRequest, NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

// POST : ajoute un administrateur ET crée son compte de connexion via une
// invitation par email (la personne définit elle-même son mot de passe).
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

    // 4) Créer le compte de connexion + envoyer l'email d'invitation
    let message = `Invitation envoyée à ${email}. La personne définit son mot de passe via le lien reçu, puis accède au back-office.`
    const { error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${SITE_URL}/admin/definir-mot-de-passe`,
    })
    if (invErr) {
      if (/already|registered|exist/i.test(invErr.message)) {
        message = `${email} a déjà un compte de connexion : la personne peut se connecter directement avec son mot de passe habituel.`
      } else {
        message = `Administrateur ajouté, mais l'email d'invitation n'a pas pu être envoyé (${invErr.message}). La personne pourra utiliser « Mot de passe oublié » ou être réinvitée.`
      }
    }

    return NextResponse.json({ ok: true, message })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
