import { NextResponse } from 'next/server'
import { testSmtpConnection, sendEmail, getSmtpConfig } from '@/lib/email'

export async function GET() {
  // Tester la connexion SMTP (config DB + env vars)
  const result = await testSmtpConnection()

  return NextResponse.json({
    connection: { success: result.success, error: result.error },
    config: result.config,
    timestamp: new Date().toISOString(),
  })
}

export async function POST() {
  // Envoyer un email de test
  const config = await getSmtpConfig()
  const adminEmail = config.adminEmail

  if (!adminEmail) {
    return NextResponse.json({ success: false, error: 'Email admin non configure. Remplissez le champ "Email admin" dans Config Email.' }, { status: 400 })
  }

  if (!config.configured) {
    return NextResponse.json({ success: false, error: 'SMTP non configure. Remplissez les champs dans Config Email.' }, { status: 400 })
  }

  const result = await sendEmail({
    to: adminEmail,
    subject: '[TLSTT] Test de configuration email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a2e); padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #3b9fd8; margin: 0; font-size: 22px;">TLSTT - Test Email</h1>
        </div>
        <div style="padding: 25px; background: #fff; border: 1px solid #e0e0e0;">
          <h2 style="color: #0f3057; margin-top: 0;">Configuration Email OK !</h2>
          <p style="color: #555;">Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              <strong>Serveur :</strong> ${config.host}:${config.port}<br>
              <strong>Expediteur :</strong> ${config.from || config.user}<br>
              <strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            Les newsletters, notifications et emails de contact utiliseront cette configuration.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="color: #999; font-size: 12px; margin: 0;">TLSTT - Toulon La Seyne Tennis de Table</p>
        </div>
      </div>
    `,
    text: 'Test de configuration email TLSTT - Si vous recevez cet email, tout fonctionne correctement.',
  })

  return NextResponse.json(result)
}
