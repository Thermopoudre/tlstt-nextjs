import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inscription à la newsletter, côté serveur.
 *
 * Avant, le formulaire écrivait directement en base depuis le navigateur :
 * impossible de limiter le rythme des inscriptions (spam) et la réponse
 * révélait si une adresse était déjà inscrite (énumération d'emails).
 * Ici : limite par adresse IP, réponse identique quel que soit l'état de
 * l'adresse, et écriture avec le client serveur.
 */

const tentatives = new Map<string, { count: number; resetAt: number }>()
const LIMITE = 5
const FENETRE_MS = 15 * 60 * 1000

function sousLaLimite(ip: string): boolean {
  const maintenant = Date.now()
  const e = tentatives.get(ip)
  if (!e || maintenant > e.resetAt) {
    tentatives.set(ip, { count: 1, resetAt: maintenant + FENETRE_MS })
    return true
  }
  if (e.count >= LIMITE) return false
  e.count++
  return true
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'inconnue'

    if (!sousLaLimite(ip)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const firstName = String(body.firstName || '').trim().slice(0, 80)
    const lastName = String(body.lastName || '').trim().slice(0, 80)
    // champ piège pour les robots : un humain ne le remplit jamais
    if (body.website) return NextResponse.json({ ok: true })

    if (!EMAIL.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const sb = createAdminClient()
    const { data: existant } = await sb
      .from('newsletter_subscribers')
      .select('id, is_subscribed')
      .eq('email', email)
      .maybeSingle()

    if (existant) {
      if (!existant.is_subscribed) {
        await sb
          .from('newsletter_subscribers')
          .update({ is_subscribed: true, unsubscribed_at: null })
          .eq('id', existant.id)
      }
    } else {
      const { error } = await sb
        .from('newsletter_subscribers')
        .insert([{ email, first_name: firstName, last_name: lastName, is_subscribed: true }])
      if (error) throw error
    }

    // Même réponse dans tous les cas : on ne révèle pas si l'adresse était connue.
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
