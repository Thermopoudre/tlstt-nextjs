import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insérer le message dans la base de données
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'new'
      })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // TODO: Envoyer un email de notification (optionnel)
    // await sendNotificationEmail({ name, email, subject, message })

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
