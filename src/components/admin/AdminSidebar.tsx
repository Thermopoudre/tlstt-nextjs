'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface AdminSidebarProps {
  admin: { name?: string; email?: string; role?: string }
}

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [badges, setBadges] = useState({ membres: 0, messages: 0 })

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/admin/badges')
        if (res.ok) {
          const data = await res.json()
          setBadges(data)
        }
      } catch {}
    }
    fetchBadges()
    const interval = setInterval(fetchBadges, 60_000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === path
    return pathname?.startsWith(path)
  }

  const menuSections = [
    {
      title: 'Général',
      items: [
        { title: 'Dashboard', icon: 'fa-home', path: '/admin' },
        { title: 'Page d\'accueil', icon: 'fa-house-chimney', path: '/admin/accueil' },
        { title: 'Paramètres', icon: 'fa-cog', path: '/admin/parametres' },
      ]
    },
    {
      title: 'Contenu',
      items: [
        { title: 'Actualités', icon: 'fa-newspaper', path: '/admin/actualites' },
        { title: 'Alertes', icon: 'fa-bell', path: '/admin/alertes' },
        { title: 'Carousel', icon: 'fa-images', path: '/admin/carousel' },
        { title: 'Galerie', icon: 'fa-photo-film', path: '/admin/galerie' },
        { title: 'Newsletter', icon: 'fa-envelope-open-text', path: '/admin/newsletter' },
      ]
    },
    {
      title: 'Club',
      items: [
        { title: 'Membres', icon: 'fa-id-card', path: '/admin/membres', badgeKey: 'membres' as const },
        { title: 'Joueurs', icon: 'fa-user-group', path: '/admin/joueurs' },
        { title: 'Équipes', icon: 'fa-people-group', path: '/admin/equipes' },
        { title: 'Compétitions', icon: 'fa-trophy', path: '/admin/competitions' },
        { title: 'Palmarès', icon: 'fa-medal', path: '/admin/palmares' },
        { title: 'Planning', icon: 'fa-calendar-alt', path: '/admin/planning' },
        { title: 'À propos', icon: 'fa-info-circle', path: '/admin/club' },
        { title: 'Labels FFTT', icon: 'fa-award', path: '/admin/labels' },
      ]
    },
    {
      title: 'E-commerce',
      items: [
        { title: 'Boutique', icon: 'fa-shop', path: '/admin/boutique' },
        { title: 'Marketplace', icon: 'fa-store', path: '/admin/marketplace' },
        { title: 'Commandes', icon: 'fa-shopping-cart', path: '/admin/commandes' },
        { title: 'HelloAsso', icon: 'fa-credit-card', path: '/admin/helloasso' },
      ]
    },
    {
      title: 'Communication',
      items: [
        { title: 'Messages', icon: 'fa-comments', path: '/admin/messages', badgeKey: 'messages' as const },
        { title: 'Contact', icon: 'fa-address-card', path: '/admin/contact' },
        { title: 'Config Email', icon: 'fa-envelope', path: '/admin/email' },
        { title: 'Partenaires', icon: 'fa-handshake', path: '/admin/partenaires' },
      ]
    },
    {
      title: 'Infos pratiques',
      items: [
        { title: 'Tarifs', icon: 'fa-euro-sign', path: '/admin/tarifs' },
        { title: 'FAQ', icon: 'fa-circle-question', path: '/admin/faq' },
      ]
    },
    {
      title: 'Pages',
      items: [
        { title: 'Mentions légales', icon: 'fa-scale-balanced', path: '/admin/pages/mentions-legales' },
        { title: 'Confidentialité', icon: 'fa-shield', path: '/admin/pages/confidentialite' },
        { title: 'Cookies', icon: 'fa-cookie', path: '/admin/pages/cookies' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { title: 'Administrateurs', icon: 'fa-user-shield', path: '/admin/admins' },
      ]
    },
  ]

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-primary text-white p-3 rounded-lg shadow-lg"
      >
        <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen ${sidebarWidth} bg-primary text-white shadow-2xl z-50
        transition-all duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Titre */}
        <div className="p-4 border-b border-blue-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-full p-1 flex-shrink-0">
              <Image
                src="/logo.jpeg"
                alt="TLSTT"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-lg truncate">TLSTT Admin</h2>
                <p className="text-xs text-blue-200">Back-office</p>
              </div>
            )}
          </Link>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-blue-800/50 transition-colors flex-shrink-0"
            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'} text-xs text-blue-300`}></i>
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-3 border-b border-blue-800 bg-blue-900/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {admin.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{admin.name || 'Admin'}</p>
                <p className="text-xs text-blue-200 truncate">{admin.role || 'Administrateur'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className={`p-2 overflow-y-auto scrollbar-thin ${collapsed ? 'h-[calc(100vh-130px)]' : 'h-[calc(100vh-200px)]'}`}>
          {menuSections.map((section, idx) => (
            <div key={idx} className="mb-3">
              {!collapsed && (
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1.5 px-3">
                  {section.title}
                </p>
              )}
              {collapsed && idx > 0 && <div className="border-t border-blue-800/50 my-2" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      title={collapsed ? item.title : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                        isActive(item.path)
                          ? 'bg-white text-primary shadow-lg font-semibold'
                          : 'text-white/90 hover:bg-blue-800/50'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        <i className={`fas ${item.icon} w-5 text-center`}></i>
                        {badgeCount > 0 && collapsed && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {badgeCount > 0 && (
                            <span className={`min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center font-bold ${
                              isActive(item.path) ? 'bg-[#3b9fd8] text-white' : 'bg-red-500 text-white'
                            }`}>
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-blue-800 bg-blue-900/20">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <Link
                href="/"
                target="_blank"
                title="Voir le site"
                className="flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:bg-blue-800/50 transition-all"
              >
                <i className="fas fa-external-link text-sm"></i>
              </Link>
              <Link
                href="/api/auth/logout"
                title="Déconnexion"
                className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-red-600 transition-all"
              >
                <i className="fas fa-sign-out-alt text-sm"></i>
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-blue-800/50 transition-all text-sm"
              >
                <i className="fas fa-external-link w-4"></i>
                <span>Voir le site</span>
              </Link>
              <Link
                href="/api/auth/logout"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-red-600 transition-all text-sm"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Déconnexion</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
