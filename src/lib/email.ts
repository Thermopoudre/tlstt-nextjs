import nodemailer from 'nodemailer'
import { createClient as createServerClient } from '@/lib/supabase/server'

interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  replyTo?: string
  bcc?: string | string[]
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  adminEmail: string
  configured: boolean
}

/**
 * Recupere la configuration SMTP depuis la table settings (DB) avec fallback env vars.
 * Priorite : DB > Variables d'environnement
 */
export async function getSmtpConfig(): Promise<SmtpConfig> {
  let dbSettings: Record<string, string> = {}

  try {
    const supabase = await createServerClient()
    const { data } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_admin_email'])

    if (data) {
      data.forEach((s: { setting_key: string; setting_value: string | null }) => {
        if (s.setting_value) {
          dbSettings[s.setting_key] = s.setting_value
        }
      })
    }
  } catch {
    // Silently fallback to env vars if DB read fails
  }

  const host = dbSettings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(dbSettings.smtp_port || process.env.SMTP_PORT || '587')
  const secure = (dbSettings.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true' || port === 465
  const user = dbSettings.smtp_user || process.env.SMTP_USER || ''
  const pass = dbSettings.smtp_pass || process.env.SMTP_PASS || ''
  const from = dbSettings.smtp_from || process.env.SMTP_FROM || user
  const adminEmail = dbSettings.smtp_admin_email || process.env.SMTP_ADMIN_EMAIL || user

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    adminEmail,
    configured: !!(user && pass),
  }
}

/**
 * Creer un transporter SMTP a partir de la config (DB + env vars).
 */
function createTransporterFromConfig(config: SmtpConfig) {
  if (!config.configured) {
    console.warn('SMTP non configure: user et pass manquants')
    return null
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })
}

/**
 * Creer un transporter SMTP (async, lit la config DB).
 */
async function createTransporter() {
  const config = await getSmtpConfig()
  return createTransporterFromConfig(config)
}

/**
 * Envoyer un email via SMTP (config DB + env vars)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const config = await getSmtpConfig()
  const transporter = createTransporterFromConfig(config)

  if (!transporter) {
    return { success: false, error: 'SMTP non configure. Allez dans Administration > Config Email pour configurer.' }
  }

  try {
    await transporter.sendMail({
      from: config.from ? `"TLSTT" <${config.from}>` : config.user,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
    })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur envoi email:', message)
    return { success: false, error: message }
  }
}

/**
 * Envoyer une notification de nouveau message de contact
 */
export async function sendContactNotification(data: {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
}): Promise<{ success: boolean; error?: string }> {
  const config = await getSmtpConfig()
  const adminEmail = config.adminEmail

  if (!adminEmail) {
    return { success: false, error: 'Email admin non configure' }
  }

  return sendEmail({
    to: adminEmail,
    subject: `[TLSTT] Nouveau message: ${data.subject}`,
    replyTo: data.email,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0f3057; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Nouveau Message de Contact</h1>
          <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">Site TLSTT</p>
        </div>
        <div style="padding: 24px; background: #f8f9fa; border: 1px solid #e0e0e0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Nom :</td>
              <td style="padding: 8px 0; color: #333;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Email :</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #3b9fd8;">${data.email}</a></td>
            </tr>
            ${data.phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Telephone :</td>
              <td style="padding: 8px 0; color: #333;">${data.phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Sujet :</td>
              <td style="padding: 8px 0; color: #333;">${data.subject}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
            <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message :</p>
            <p style="color: #333; white-space: pre-wrap; margin: 0;">${data.message}</p>
          </div>
        </div>
        <div style="padding: 16px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e0e0e0;">
          Cet email a ete envoye automatiquement depuis le site TLSTT
        </div>
      </div>
    `,
    text: `Nouveau message de ${data.name} (${data.email})\n\nSujet: ${data.subject}\n\n${data.message}`,
  })
}

/**
 * Envoyer un email de bienvenue a un nouveau membre
 */
export async function sendWelcomeEmail(email: string, firstName: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'Bienvenue au TLSTT !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0f3057; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Bienvenue au TLSTT !</h1>
        </div>
        <div style="padding: 24px; background: white;">
          <p style="font-size: 16px; color: #333;">Bonjour ${firstName},</p>
          <p style="color: #555;">Votre compte a ete cree avec succes sur le site du Toulon La Seyne Tennis de Table.</p>
          <p style="color: #555;">Vous pouvez maintenant :</p>
          <ul style="color: #555;">
            <li>Acceder a votre espace membre</li>
            <li>Consulter la boutique du club</li>
            <li>Suivre les resultats et progressions</li>
            <li>Recevoir les communications du club</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://tlstt-nextjs.vercel.app/espace-membre" style="display: inline-block; background: #3b9fd8; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Mon Espace Membre
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">A bientot sur les tables !</p>
        </div>
        <div style="padding: 16px; text-align: center; color: #999; font-size: 12px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
          TLSTT - Toulon La Seyne Tennis de Table
        </div>
      </div>
    `,
  })
}

/**
 * Tester la connexion SMTP
 */
export async function testSmtpConnection(): Promise<{ success: boolean; error?: string; config?: Partial<SmtpConfig> }> {
  const config = await getSmtpConfig()
  const transporter = createTransporterFromConfig(config)

  const configInfo = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user ? `${config.user.substring(0, 3)}***` : 'non configure',
    from: config.from || 'non configure',
    adminEmail: config.adminEmail || 'non configure',
    configured: config.configured,
  }

  if (!transporter) {
    return { success: false, error: 'SMTP non configure. Allez dans Administration > Config Email.', config: configInfo }
  }

  try {
    await transporter.verify()
    return { success: true, config: configInfo }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { success: false, error: message, config: configInfo }
  }
}
