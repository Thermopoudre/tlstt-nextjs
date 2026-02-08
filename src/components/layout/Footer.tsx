import Link from 'next/link'
import { getGlobalSettings } from '@/lib/settings'

export default async function Footer() {
  const settings = await getGlobalSettings()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0a0a0a] text-white mt-auto border-t border-[#3b9fd8]/20">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Colonne 1 - Logo et description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img src="/logo.jpeg" alt={settings.site_name} className="w-10 h-10 rounded-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{settings.site_name}</h3>
                <p className="text-xs text-gray-500">Depuis {settings.foundation_year}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {settings.club_description}
            </p>
          </div>

          {/* Colonne 2 - Navigation */}
          <div>
            <h4 className="font-bold text-[#3b9fd8] mb-4 flex items-center gap-2">
              <i className="fas fa-compass"></i>
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/club/a-propos" className="text-gray-400 hover:text-[#3b9fd8] transition-colors flex items-center gap-2">
                  <i className="fas fa-info-circle w-4"></i> À propos
                </Link>
              </li>
              <li>
                <Link href="/joueurs" className="text-gray-400 hover:text-[#3b9fd8] transition-colors flex items-center gap-2">
                  <i className="fas fa-users w-4"></i> Joueurs
                </Link>
              </li>
              <li>
                <Link href="/planning" className="text-gray-400 hover:text-[#3b9fd8] transition-colors flex items-center gap-2">
                  <i className="fas fa-calendar w-4"></i> Planning
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#3b9fd8] transition-colors flex items-center gap-2">
                  <i className="fas fa-envelope w-4"></i> Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Légal */}
          <div>
            <h4 className="font-bold text-[#3b9fd8] mb-4 flex items-center gap-2">
              <i className="fas fa-shield-alt"></i>
              Informations
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/politique-cookies" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
                  Politique cookies
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 - Réseaux sociaux */}
          <div>
            <h4 className="font-bold text-[#3b9fd8] mb-4 flex items-center gap-2">
              <i className="fas fa-share-alt"></i>
              Suivez-nous
            </h4>
            <div className="flex flex-wrap gap-3">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-[#1877f2] hover:border-[#1877f2] transition-all hover:scale-110"
                  title="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] hover:border-transparent transition-all hover:scale-110"
                  title="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              )}
            </div>

            {/* Contact rapide */}
            <div className="mt-4 space-y-2 text-sm">
              <a href={`mailto:${settings.contact_email}`} className="text-gray-400 hover:text-[#3b9fd8] transition-colors flex items-center gap-2">
                <i className="fas fa-envelope w-4"></i>
                {settings.contact_email}
              </a>
              <p className="text-gray-500 flex items-center gap-2">
                <i className="fas fa-map-marker-alt w-4"></i>
                {settings.city}, {settings.postal_code}
              </p>
            </div>
          </div>
        </div>

        {/* Barre du bas */}
        <div className="border-t border-[#222] mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              &copy; {currentYear} {settings.site_description}. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.fftt.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-[#3b9fd8] transition-colors text-sm flex items-center gap-2"
              >
                <i className="fas fa-table-tennis-paddle-ball"></i>
                FFTT
              </a>
              <span className="text-gray-700">|</span>
              <span className="text-gray-500 text-sm">Club N°{settings.club_number}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
