import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

export async function POST(req: NextRequest) {
  try {
    // Vérification auth admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!adminData) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { messageId, to, name, replyText } = await req.json()

    if (!to || !name || !replyText?.trim()) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const safeName = escapeHtml(String(name))
    const safeReplyHtml = escapeHtml(String(replyText)).replace(/\n/g, '<br>')

    const result = await sendEmail({
      to,
      subject: `Réponse du TLSTT`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f3057; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">TLSTT</h1>
            <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">Toulon La Seyne Tennis de Table</p>
          </div>
          <div style="padding: 24px; background: white;">
            <p style="font-size: 16px; color: #333;">Bonjour ${safeName},</p>
            <div style="margin: 16px 0; padding: 16px; background: #f8f9fa; border-left: 4px solid #3b9fd8; border-radius: 4px;">
              <p style="color: #333; white-space: pre-wrap; margin: 0;">${safeReplyHtml}</p>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 24px;">Cordialement,<br>L'équipe TLSTT</p>
          </div>
          <div style="padding: 16px; text-align: center; color: #999; font-size: 12px; background: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
            TLSTT - Toulon La Seyne Tennis de Table
          </div>
        </div>
      `,
      text: `Bonjour ${name},\n\n${replyText}\n\nCordialement,\nL'équipe TLSTT`,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Marquer comme lu si un messageId est fourni
    if (messageId) {
      await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', messageId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur reply-message:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
