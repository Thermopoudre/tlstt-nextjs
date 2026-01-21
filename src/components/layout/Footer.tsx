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
    <footer className="bg-[#0f3057] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Colonne gauche - Logo et description */}
          <div>
            <h3 className="text-xl font-bold mb-3">
              <span className="text-white">Toulon La Seyne</span>{' '}
              <span className="text-[#5bc0de]">Tennis de Table</span>
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Club de tennis de table affilié à la FFTT, accueillant joueurs de tous niveaux.
            </p>
          </div>

          {/* Colonne centrale - Liens */}
          <div>
            <h4 className="font-bold text-[#5bc0de] mb-3">Liens utiles</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="/mentions-legales" className="text-gray-400 hover:text-[#5bc0de] transition-colors">
                Mentions Légales
              </Link>
              <Link href="/politique-confidentialite" className="text-gray-400 hover:text-[#5bc0de] transition-colors">
                Confidentialité
              </Link>
              <Link href="/politique-cookies" className="text-gray-400 hover:text-[#5bc0de] transition-colors">
                Cookies
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-[#5bc0de] transition-colors">
                Contact
              </Link>
              <Link href="/admin" className="text-gray-400 hover:text-[#5bc0de] transition-colors">
                Administration
              </Link>
            </div>
          </div>

          {/* Colonne droite - Réseaux sociaux */}
          <div>
            <h4 className="font-bold text-[#5bc0de] mb-3">Suivez-nous</h4>
            {hasSocial ? (
              <div className="flex items-center gap-3">
                {socialLinks.social_facebook && (
                  <a
                    href={socialLinks.social_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#1a5a8a] rounded-full flex items-center justify-center text-white hover:bg-[#5bc0de] transition-colors"
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
                    className="w-10 h-10 bg-[#1a5a8a] rounded-full flex items-center justify-center text-white hover:bg-[#5bc0de] transition-colors"
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
                    className="w-10 h-10 bg-[#1a5a8a] rounded-full flex items-center justify-center text-white hover:bg-[#5bc0de] transition-colors"
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
                    className="w-10 h-10 bg-[#1a5a8a] rounded-full flex items-center justify-center text-white hover:bg-[#5bc0de] transition-colors"
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
                    className="w-10 h-10 bg-[#1a5a8a] rounded-full flex items-center justify-center text-white hover:bg-[#5bc0de] transition-colors"
                    title="X (Twitter)"
                  >
                    <i className="fab fa-x-twitter"></i>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Bientôt disponible</p>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#1a5a8a] mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Toulon La Seyne Tennis de Table. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
