import { NextRequest, NextResponse } from 'next/server'
import { createReadOnlyClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const LIBELLE_CATEGORIE: Record<string, string> = {
  club: 'Vie du club',
  tt: 'Tennis de table',
  handi: 'Handisport',
}

function construireEmail(opts: {
  titre: string
  chapeau: string
  url: string
  image?: string | null
  categorie: string
}) {
  const { titre, chapeau, url, image, categorie } = opts
  const libelle = LIBELLE_CATEGORIE[categorie] || 'Actualité'
  const imageSure = image && /^https?:\/\//.test(image) ? encodeURI(image) : null

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <div style="background:#0a0a0a;padding:22px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:22px;letter-spacing:1px;">TLSTT</h2>
    <p style="color:#888;margin:6px 0 0;font-size:12px;">Toulon La Seyne Tennis de Table</p>
  </div>
  ${imageSure ? `<img src="${imageSure}" alt="" style="width:100%;max-height:260px;object-fit:cover;display:block;">` : ''}
  <div style="padding:28px;">
    <span style="display:inline-block;background:#3b9fd8;color:#fff;font-size:11px;font-weight:bold;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.5px;">${escapeHtml(libelle)}</span>
    <h1 style="color:#1a1a2e;font-size:22px;line-height:1.3;margin:16px 0 12px;">${escapeHtml(titre)}</h1>
    ${chapeau ? `<p style="color:#555;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(chapeau)}</p>` : ''}
    <div style="text-align:center;margin-top:26px;">
      <a href="${encodeURI(url)}" style="display:inline-block;background:#3b9fd8;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Lire l'article</a>
    </div>
  </div>
  <div style="background:#0a0a0a;padding:18px;text-align:center;">
    <p style="color:#777;font-size:11px;margin:0 0 6px;">Vous recevez ce message en tant que membre du TLSTT.</p>
    <p style="margin:0;"><a href="${SITE_URL}/espace-membre/profil" style="color:#3b9fd8;font-size:11px;">Gérer mes notifications</a></p>
  </div>
</div>
</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    // 1. Seul un administrateur actif peut déclencher un envoi
    const sb = await createReadOnlyClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data: admin } = await sb
      .from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
    if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

    const { articleId } = await request.json()
    if (!articleId) return NextResponse.json({ error: 'articleId requis' }, { status: 400 })

    const service = createAdminClient()

    // 2. L'article doit exister, être publié, et ne pas être un import automatique
    const { data: article, error: errArticle } = await service
      .from('news')
      .select('id, title, excerpt, category, status, image_url, is_external, source_url, notified_at')
      .eq('id', articleId)
      .single()

    if (errArticle || !article) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }
    if (article.status !== 'published') {
      return NextResponse.json({ error: "L'article n'est pas publié" }, { status: 400 })
    }
    if (article.is_external || article.source_url) {
      return NextResponse.json(
        { skipped: true, reason: 'Article importé automatiquement : aucune notification envoyée.' },
      )
    }
    if (article.notified_at) {
      return NextResponse.json(
        { skipped: true, reason: 'Les membres ont déjà été prévenus pour cet article.' },
      )
    }

    // 3. Configuration d'envoi
    const smtp = await getSmtpConfig()
    if (!smtp.configured) {
      return NextResponse.json(
        { skipped: true, reason: "L'envoi d'emails n'est pas encore configuré (Admin → Config Email)." },
      )
    }

    // 4. Destinataires : membres validés ayant accepté + abonnés du formulaire public
    const { data: membres } = await service
      .from('member_profiles')
      .select('id, newsletter_subscribed, is_validated')
      .eq('is_validated', true)
      .eq('newsletter_subscribed', true)

    const emails = new Set<string>()

    if (membres?.length) {
      // l'adresse vit dans auth.users : on la récupère via l'API d'administration
      const { data: liste } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const parId = new Map((liste?.users || []).map(u => [u.id, u.email]))
      for (const m of membres) {
        const mail = parId.get(m.id)
        if (mail) emails.add(mail.toLowerCase())
      }
    }

    const { data: abonnes } = await service
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_subscribed', true)
    for (const a of abonnes || []) {
      if (a.email) emails.add(String(a.email).toLowerCase())
    }

    const destinataires = [...emails]
    if (destinataires.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'Aucun destinataire' })
    }

    // 5. Envoi par lots, en copie cachée (les adresses ne sont jamais exposées)
    const url = `${SITE_URL}/actualites/${article.category}/${article.id}`
    const html = construireEmail({
      titre: article.title,
      chapeau: article.excerpt || '',
      url,
      image: article.image_url,
      categorie: article.category,
    })

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    })

    let envoyes = 0
    const echecs: string[] = []
    const TAILLE_LOT = 40
    for (let i = 0; i < destinataires.length; i += TAILLE_LOT) {
      const lot = destinataires.slice(i, i + TAILLE_LOT)
      try {
        await transporter.sendMail({
          from: `"TLSTT" <${smtp.from || smtp.user}>`,
          replyTo: smtp.replyTo || undefined,
          to: smtp.from || smtp.user,
          bcc: lot.join(','),
          subject: `[TLSTT] ${article.title}`,
          html,
        })
        envoyes += lot.length
      } catch (e) {
        echecs.push(e instanceof Error ? e.message : 'erreur inconnue')
      }
    }

    if (envoyes > 0) {
      await service.from('news').update({ notified_at: new Date().toISOString() }).eq('id', article.id)
    }

    return NextResponse.json({
      sent: envoyes,
      total: destinataires.length,
      erreurs: echecs.length ? echecs.slice(0, 2) : undefined,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
