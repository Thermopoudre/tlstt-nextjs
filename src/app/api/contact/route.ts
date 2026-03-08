import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendContactNotification } from '@/lib/email'

// Rate limiting simple en mémoire (5 requêtes / 15 min par IP)
// Note: sur Vercel serverless, chaque instance a sa propre mémoire
// → efficace contre les soumissions rapides, pas contre les attaques distribuées
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 60_000)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'IP du client (Vercel fournit x-forwarded-for)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validation : champs obligatoires
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Validation : longueurs max (prévention injection email header)
    if (typeof name !== 'string' || name.trim().length > 100) {
      return NextResponse.json({ error: 'Nom invalide (max 100 caractères)' }, { status: 400 })
    }
    if (typeof email !== 'string' || email.length > 255 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }
    if (typeof subject !== 'string' || subject.trim().length > 200) {
      return NextResponse.json({ error: 'Sujet trop long (max 200 caractères)' }, { status: 400 })
    }
    if (typeof message !== 'string' || message.trim().length > 5000) {
      return NextResponse.json({ error: 'Message trop long (max 5000 caractères)' }, { status: 400 })
    }
    if (phone && (typeof phone !== 'string' || phone.length > 30)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }

    const supabase = await createClient()

    // Insérer le message dans la base de données
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'new'
      })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Envoyer un email de notification a l'admin
    const emailResult = await sendContactNotification({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      phone: phone?.trim()
    })
    if (!emailResult.success) {
      console.warn('Email notification non envoye:', emailResult.error)
      // On ne bloque pas la soumission si l'email echoue
    }

    return NextResponse.json(
      { success: true, message: 'Message envoyé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
