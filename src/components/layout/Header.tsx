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
    {
      label: 'Actualités',
      href: '/actualites/club',
      submenu: [
        { label: 'Actualités du Club', href: '/actualites/club' },
        { label: 'Actualités Ping', href: '/actualites/tt' },
        { label: 'Handisport', href: '/actualites/handi' },
        { label: 'Newsletters', href: '/newsletters' },
      ],
    },
    { label: 'Équipes', href: '/equipes' },
    {
      label: 'Joueurs',
      href: '/joueurs',
      submenu: [
        { label: 'Liste des Joueurs', href: '/joueurs' },
        { label: 'Top Progressions', href: '/progressions' },
      ],
    },
    {
      label: 'Compétitions',
      href: '/competitions',
      submenu: [
        { label: 'Calendrier', href: '/competitions' },
        { label: 'Classements', href: '/equipes' },
        { label: 'Planning', href: '/planning' },
      ],
    },
    {
      label: 'Le Club',
      href: '/club/a-propos',
      submenu: [
        { label: 'À Propos', href: '/club/a-propos' },
        { label: 'Clubs PACA', href: '/clubs-paca' },
        { label: 'Galerie Photos', href: '/galerie' },
        { label: 'Partenaires', href: '/partenaires' },
      ],
    },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <>
      <header className="bg-[#0f3057] border-b border-[#5bc0de]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#5bc0de]/50 overflow-hidden bg-white">
                <Image
                  src="/logo.jpeg"
                  alt="TLSTT Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-heading text-sm lg:text-lg font-extrabold leading-tight hidden sm:block">
                <span className="text-white">Toulon La Seyne</span><br />
                <span className="text-[#5bc0de]">Tennis de Table</span>
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-[#5bc0de] text-2xl p-2"
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
                      className="block px-3 py-2 text-sm font-semibold text-gray-300 hover:text-[#5bc0de] transition-colors"
                    >
                      {item.label}
                      {item.submenu && (
                        <i className="fas fa-chevron-down ml-1 text-[10px]"></i>
                      )}
                    </Link>

                    {/* Submenu */}
                    {item.submenu && (
                      <ul className="absolute left-0 top-full bg-[#1a5a8a] border border-[#5bc0de]/20 shadow-xl rounded-lg py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                        {item.submenu.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              href={subItem.href}
                              className="block px-5 py-2 text-sm text-gray-300 hover:bg-[#5bc0de]/20 hover:text-[#5bc0de] transition-colors"
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

              {/* Auth Section - Desktop */}
              <div className="ml-4 flex items-center gap-2 border-l border-white/20 pl-4">
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
                ) : user ? (
                  <UserMenu />
                ) : (
                  <>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-3 py-1.5 text-sm text-white/80 hover:text-[#5bc0de] font-medium transition-colors"
                    >
                      Connexion
                    </button>
                    <button
                      onClick={() => setShowRegister(true)}
                      className="px-4 py-1.5 bg-[#5bc0de] text-white text-sm font-bold rounded-full hover:bg-[#4ab0ce] transition-all whitespace-nowrap"
                    >
                      Devenir Membre
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
                    {item.submenu && (
                      <ul className="pl-6 flex flex-col gap-1 mt-1">
                        {item.submenu.map((subItem, subIndex) => (
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
                <div className="mt-4 pt-4 border-t border-[#5bc0de]/20 flex flex-col gap-2 px-4">
                  <button
                    onClick={() => { setShowLogin(true); setMobileMenuOpen(false) }}
                    className="py-2 text-white/80 hover:text-[#5bc0de] font-semibold text-left"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>Connexion
                  </button>
                  <button
                    onClick={() => { setShowRegister(true); setMobileMenuOpen(false) }}
                    className="py-2 bg-[#5bc0de] text-white font-bold rounded-full hover:bg-[#4ab0ce]"
                  >
                    <i className="fas fa-user-plus mr-2"></i>Devenir Membre
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
