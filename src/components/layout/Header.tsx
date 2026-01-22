'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import UserMenu from '@/components/auth/UserMenu'
import LoginModal from '@/components/auth/LoginModal'
import RegisterModal from '@/components/auth/RegisterModal'

export default function Header() {
  const { user, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const menuItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Actu', href: '/actualites/club', hasSubmenu: true },
    { label: 'Équipes', href: '/equipes' },
    { label: 'Joueurs', href: '/joueurs', hasSubmenu: true },
    { label: 'Compét.', href: '/competitions', hasSubmenu: true },
    { label: 'Club', href: '/club/a-propos', hasSubmenu: true },
    { label: 'Contact', href: '/contact' },
  ]

  const submenus: Record<string, { label: string; href: string }[]> = {
    'Actu': [
      { label: 'Actualités Club', href: '/actualites/club' },
      { label: 'Actualités Ping', href: '/actualites/tt' },
      { label: 'Handisport', href: '/actualites/handi' },
    ],
    'Joueurs': [
      { label: 'Liste Joueurs', href: '/joueurs' },
      { label: 'Progressions', href: '/progressions' },
    ],
    'Compét.': [
      { label: 'Calendrier', href: '/competitions' },
      { label: 'Classements', href: '/equipes' },
      { label: 'Planning', href: '/planning' },
    ],
    'Club': [
      { label: 'À Propos', href: '/club/a-propos' },
      { label: 'Clubs PACA', href: '/clubs-paca' },
      { label: 'Galerie', href: '/galerie' },
      { label: 'Partenaires', href: '/partenaires' },
    ],
  }

  return (
    <>
      <header className="bg-[#0f3057] border-b border-[#5bc0de]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="relative w-9 h-9 rounded-full border-2 border-[#5bc0de]/50 overflow-hidden bg-white">
                <Image
                  src="/logo.jpeg"
                  alt="TLSTT"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-heading text-sm font-bold leading-tight hidden sm:block">
                <span className="text-white">TLSTT</span>
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-[#5bc0de] text-xl p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <ul className="flex">
                {menuItems.map((item, index) => (
                  <li key={index} className="relative group">
                    <Link
                      href={item.href}
                      className="block px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-[#5bc0de] transition-colors"
                    >
                      {item.label}
                      {item.hasSubmenu && (
                        <i className="fas fa-chevron-down ml-1 text-[8px]"></i>
                      )}
                    </Link>

                    {/* Submenu */}
                    {item.hasSubmenu && submenus[item.label] && (
                      <ul className="absolute left-0 top-full bg-[#1a5a8a] border border-[#5bc0de]/20 shadow-xl rounded-lg py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                        {submenus[item.label].map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              href={subItem.href}
                              className="block px-4 py-1.5 text-xs text-gray-300 hover:bg-[#5bc0de]/20 hover:text-[#5bc0de] transition-colors"
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              {/* Auth Section */}
              <div className="ml-3 flex items-center gap-1.5 border-l border-white/20 pl-3">
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
                ) : user ? (
                  <UserMenu />
                ) : (
                  <>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-2.5 py-1.5 text-xs text-white/80 hover:text-[#5bc0de] font-medium transition-colors"
                      title="Connexion"
                    >
                      <i className="fas fa-sign-in-alt"></i>
                      <span className="ml-1 hidden xl:inline">Connexion</span>
                    </button>
                    <button
                      onClick={() => setShowRegister(true)}
                      className="w-8 h-8 bg-[#5bc0de] text-white rounded-full hover:bg-[#4ab0ce] transition-all flex items-center justify-center"
                      title="Devenir Membre"
                    >
                      <i className="fas fa-table-tennis-paddle-ball text-sm"></i>
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden pb-4 border-t border-[#5bc0de]/20 mt-2 pt-4">
              <ul className="flex flex-col gap-1">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="block px-4 py-2 font-semibold text-gray-300 hover:bg-[#5bc0de]/20 hover:text-[#5bc0de] rounded transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                    {item.hasSubmenu && submenus[item.label] && (
                      <ul className="pl-6 flex flex-col gap-1 mt-1">
                        {submenus[item.label].map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              href={subItem.href}
                              className="block px-4 py-1 text-sm text-gray-400 hover:bg-[#5bc0de]/10 hover:text-[#5bc0de] rounded transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              {/* Mobile Auth */}
              {!user && !loading && (
                <div className="mt-4 pt-4 border-t border-[#5bc0de]/20 flex gap-2 px-4">
                  <button
                    onClick={() => { setShowLogin(true); setMobileMenuOpen(false) }}
                    className="flex-1 py-2 text-white/80 hover:text-[#5bc0de] font-semibold border border-white/20 rounded-lg"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>Connexion
                  </button>
                  <button
                    onClick={() => { setShowRegister(true); setMobileMenuOpen(false) }}
                    className="flex-1 py-2 bg-[#5bc0de] text-white font-bold rounded-lg hover:bg-[#4ab0ce]"
                  >
                    <i className="fas fa-table-tennis-paddle-ball mr-2"></i>Membre
                  </button>
                </div>
              )}
              {user && (
                <div className="mt-4 pt-4 border-t border-[#5bc0de]/20 px-4">
                  <Link
                    href="/espace-membre"
                    className="block py-2 text-[#5bc0de] font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fas fa-user-circle mr-2"></i>Mon Espace
                  </Link>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Modals */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true) }}
      />
      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true) }}
      />
    </>
  )
}
