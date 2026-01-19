import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Footer() {
  const supabase = await createClient()

  // Récupérer les réseaux sociaux depuis les settings
  const { data: settings } = await supabase
    .from('settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'social_facebook',
      'social_instagram',
      'social_tiktok',
      'social_youtube',
      'social_twitter',
    ])

  const socialLinks: Record<string, string> = {}
  settings?.forEach((setting) => {
    socialLinks[setting.setting_key] = setting.setting_value || ''
  })

  const hasSocial = Object.values(socialLinks).some((link) => link)

  return (
    <footer className="bg-white shadow-lg mt-auto">
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Colonne gauche */}
          <div>
            <p className="text-gray-600 mb-4">
              &copy; {new Date().getFullYear()} Toulon La Seyne Tennis de Table. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              <Link
                href="/mentions-legales"
                className="text-gray-600 hover:text-[#E31C23] transition-colors"
              >
                Mentions Légales
              </Link>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-[#E31C23] transition-colors"
              >
                Administration
              </Link>
            </div>
          </div>

          {/* Colonne droite - Réseaux sociaux */}
          {hasSocial && (
            <div className="md:text-right">
              <div className="flex md:justify-end items-center gap-3">
                <strong className="text-gray-700">Suivez-nous :</strong>
                {socialLinks.social_facebook && (
                  <a
                    href={socialLinks.social_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10325F] hover:text-[#E31C23] text-xl transition-colors"
                    title="Facebook"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
                {socialLinks.social_instagram && (
                  <a
                    href={socialLinks.social_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10325F] hover:text-[#E31C23] text-xl transition-colors"
                    title="Instagram"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {socialLinks.social_tiktok && (
                  <a
                    href={socialLinks.social_tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10325F] hover:text-[#E31C23] text-xl transition-colors"
                    title="TikTok"
                  >
                    <i className="fab fa-tiktok"></i>
                  </a>
                )}
                {socialLinks.social_youtube && (
                  <a
                    href={socialLinks.social_youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10325F] hover:text-[#E31C23] text-xl transition-colors"
                    title="YouTube"
                  >
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
                {socialLinks.social_twitter && (
                  <a
                    href={socialLinks.social_twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10325F] hover:text-[#E31C23] text-xl transition-colors"
                    title="X (Twitter)"
                  >
                    <i className="fab fa-x-twitter"></i>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
