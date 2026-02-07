import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendContactNotification } from '@/lib/email'

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

    // Envoyer un email de notification a l'admin
    const emailResult = await sendContactNotification({ name, email, subject, message, phone })
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
