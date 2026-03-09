'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import UserMenu from '@/components/auth/UserMenu'
import LoginModal from '@/components/auth/LoginModal'
import RegisterModal from '@/components/auth/RegisterModal'
import SearchBar from '@/components/layout/SearchBar'
import ThemeToggle from '@/components/layout/ThemeToggle'

export default function Header() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const menuItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Actualités', href: '/actualites/club', hasSubmenu: true },
    { label: 'Sport', href: '/equipes', hasSubmenu: true },
    { label: 'Club', href: '/club/a-propos', hasSubmenu: true },
    { label: 'Rejoindre', href: '/rejoindre', isCta: true },
    { label: 'Contact', href: '/contact' },
  ]

  const submenus: Record<string, { label: string; href: string; icon?: string }[]> = {
    'Actualités': [
      { label: 'Vie du Club', href: '/actualites/club', icon: 'fa-newspaper' },
      { label: 'Tennis de Table', href: '/actualites/tt', icon: 'fa-table-tennis-paddle-ball' },
      { label: 'Handisport', href: '/actualites/handi', icon: 'fa-wheelchair' },
    ],
    'Sport': [
      { label: 'Équipes & Classements', href: '/equipes', icon: 'fa-users' },
      { label: 'Joueurs', href: '/joueurs', icon: 'fa-user' },
      { label: 'Compétitions', href: '/competitions', icon: 'fa-trophy' },
      { label: 'Planning', href: '/planning', icon: 'fa-calendar' },
      { label: 'Progressions', href: '/progressions', icon: 'fa-chart-line' },
    ],
    'Club': [
      { label: 'À Propos', href: '/club/a-propos', icon: 'fa-info-circle' },
      { label: 'Palmarès', href: '/palmares', icon: 'fa-medal' },
      { label: 'Tarifs', href: '/tarifs', icon: 'fa-tags' },
      { label: 'Stages', href: '/stages', icon: 'fa-graduation-cap' },
      { label: 'Galerie', href: '/galerie', icon: 'fa-images' },
      { label: 'Partenaires', href: '/partenaires', icon: 'fa-handshake' },
      { label: 'FAQ', href: '/faq', icon: 'fa-question-circle' },
      { label: 'Clubs PACA', href: '/clubs-paca', icon: 'fa-map-marker-alt' },
      ...(user ? [{ label: 'Boutique', href: '/boutique', icon: 'fa-shopping-cart' }] : []),
    ],
  }

  return (
    <>
      <header className="bg-[#0a0a0a] border-b border-[#3b9fd8]/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="relative w-11 h-11 rounded-full border-2 border-[#3b9fd8]/50 overflow-hidden bg-white">
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
              className="lg:hidden text-[#3b9fd8] text-xl p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center">
                {menuItems.map((item, index) => (
                  <li key={index} className="relative group">
                    {(item as any).isCta ? (
                      <Link
                        href={item.href}
                        className="ml-1 mr-0.5 px-3 py-1.5 text-sm font-bold bg-[#3b9fd8] text-white rounded-full hover:bg-[#2d8bc9] transition-colors"
                      >
                        <i className="fas fa-table-tennis-paddle-ball mr-1.5"></i>
                        {item.label}
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={item.href}
                          className={`block px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                            isActive(item.href)
                              ? 'text-[#3b9fd8]'
                              : 'text-gray-300 hover:text-[#3b9fd8]'
                          }`}
                        >
                          {item.label}
                          {item.hasSubmenu && (
                            <i className="fas fa-chevron-down ml-1 text-[8px]"></i>
                          )}
                        </Link>

                        {/* Submenu */}
                        {item.hasSubmenu && submenus[item.label] && (
                          <ul className="absolute left-0 top-full bg-[#1a1a1a] border border-[#3b9fd8]/30 shadow-xl rounded-lg py-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                            {submenus[item.label].map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <Link
                                  href={subItem.href}
                                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-[#3b9fd8]/20 hover:text-[#3b9fd8] transition-colors"
                                >
                                  {subItem.icon && <i className={`fas ${subItem.icon} w-3.5 text-center opacity-60`}></i>}
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {/* Auth Section */}
              <div className="ml-2 flex items-center gap-0.5">
                <SearchBar />
                <ThemeToggle />
              </div>
              <div className="ml-1.5 flex items-center gap-1.5 border-l border-white/20 pl-3">
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
                ) : user ? (
                  <UserMenu />
                ) : (
                  <>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-2.5 py-1.5 text-xs text-white/80 hover:text-[#3b9fd8] font-medium transition-colors"
                      title="Connexion"
                    >
                      <i className="fas fa-sign-in-alt"></i>
                      <span className="ml-1 hidden xl:inline">Connexion</span>
                    </button>
                    <button
                      onClick={() => setShowRegister(true)}
                      className="w-8 h-8 bg-[#3b9fd8] text-white rounded-full hover:bg-[#2d8bc9] transition-all flex items-center justify-center"
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
            <nav className="lg:hidden pb-4 border-t border-[#3b9fd8]/30 mt-2 pt-4">
              <ul className="flex flex-col gap-1">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    {(item as any).isCta ? (
                      <Link
                        href={item.href}
                        className="flex items-center justify-center gap-2 mx-4 py-2.5 bg-[#3b9fd8] text-white font-bold rounded-xl"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <i className="fas fa-table-tennis-paddle-ball"></i>
                        {item.label}
                      </Link>
                    ) : item.hasSubmenu && submenus[item.label] ? (
                      <>
                        <button
                          className={`w-full flex items-center justify-between px-4 py-2 font-semibold rounded transition-colors ${
                            isActive(item.href)
                              ? 'text-[#3b9fd8] bg-[#3b9fd8]/10'
                              : 'text-gray-300 hover:bg-[#3b9fd8]/20 hover:text-[#3b9fd8]'
                          }`}
                          onClick={() => setOpenMobileSubmenu(openMobileSubmenu === item.label ? null : item.label)}
                        >
                          <span>{item.label}</span>
                          <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${openMobileSubmenu === item.label ? 'rotate-180' : ''}`}></i>
                        </button>
                        {openMobileSubmenu === item.label && (
                          <ul className="pl-4 flex flex-col gap-0.5 mt-1">
                            {submenus[item.label].map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <Link
                                  href={subItem.href}
                                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 hover:bg-[#3b9fd8]/10 hover:text-[#3b9fd8] rounded transition-colors"
                                  onClick={() => { setMobileMenuOpen(false); setOpenMobileSubmenu(null) }}
                                >
                                  {subItem.icon && <i className={`fas ${subItem.icon} w-4 text-center opacity-60`}></i>}
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className={`block px-4 py-2 font-semibold rounded transition-colors ${
                          isActive(item.href)
                            ? 'text-[#3b9fd8] bg-[#3b9fd8]/10'
                            : 'text-gray-300 hover:bg-[#3b9fd8]/20 hover:text-[#3b9fd8]'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {/* Mobile Auth */}
              {!user && !loading && (
                <div className="mt-4 pt-4 border-t border-[#3b9fd8]/30 flex gap-2 px-4">
                  <button
                    onClick={() => { setShowLogin(true); setMobileMenuOpen(false) }}
                    className="flex-1 py-2 text-white/80 hover:text-[#3b9fd8] font-semibold border border-white/20 rounded-lg"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>Connexion
                  </button>
                  <button
                    onClick={() => { setShowRegister(true); setMobileMenuOpen(false) }}
                    className="flex-1 py-2 bg-[#3b9fd8] text-white font-bold rounded-lg hover:bg-[#2d8bc9]"
                  >
                    <i className="fas fa-table-tennis-paddle-ball mr-2"></i>Membre
                  </button>
                </div>
              )}
              {user && (
                <div className="mt-4 pt-4 border-t border-[#3b9fd8]/30 px-4">
                  <Link
                    href="/espace-membre"
                    className="block py-2 text-[#3b9fd8] font-semibold"
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
