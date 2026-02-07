import { NextResponse } from 'next/server'
import { testSmtpConnection, sendEmail } from '@/lib/email'

export async function GET() {
  // Tester la connexion SMTP
  const result = await testSmtpConnection()

  return NextResponse.json({
    smtp: {
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'non configure',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'non configure',
      adminEmail: process.env.SMTP_ADMIN_EMAIL || process.env.SMTP_USER || 'non configure',
    },
    connection: result,
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  // Envoyer un email de test
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || process.env.SMTP_USER

  if (!adminEmail) {
    return NextResponse.json({ success: false, error: 'SMTP non configure' }, { status: 400 })
  }

  const result = await sendEmail({
    to: adminEmail,
    subject: '[TLSTT] Test de configuration email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0f3057;">Configuration Email OK</h1>
        <p>Si vous recevez cet email, la configuration SMTP du site TLSTT fonctionne correctement.</p>
        <p style="color: #999; font-size: 12px;">Envoye le ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    `,
    text: 'Test de configuration email TLSTT - Si vous recevez cet email, tout fonctionne correctement.',
  })

  return NextResponse.json(result)
}
