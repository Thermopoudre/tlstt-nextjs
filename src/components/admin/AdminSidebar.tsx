'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'

interface AdminSidebarProps {
  admin: any
}

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === path
    }
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
        { title: 'Carousel', icon: 'fa-images', path: '/admin/carousel' },
        { title: 'Galerie', icon: 'fa-photo-film', path: '/admin/galerie' },
        { title: 'Newsletter', icon: 'fa-envelope-open-text', path: '/admin/newsletter' },
      ]
    },
    {
      title: 'Club',
      items: [
        { title: 'Joueurs', icon: 'fa-user-group', path: '/admin/joueurs' },
        { title: 'Équipes', icon: 'fa-people-group', path: '/admin/equipes' },
        { title: 'Compétitions', icon: 'fa-trophy', path: '/admin/competitions' },
        { title: 'Planning', icon: 'fa-calendar-alt', path: '/admin/planning' },
        { title: 'À propos', icon: 'fa-info-circle', path: '/admin/club' },
      ]
    },
    {
      title: 'E-commerce',
      items: [
        { title: 'Boutique', icon: 'fa-shop', path: '/admin/boutique' },
        { title: 'Marketplace', icon: 'fa-store', path: '/admin/marketplace' },
        { title: 'Commandes', icon: 'fa-shopping-cart', path: '/admin/commandes' },
      ]
    },
    {
      title: 'Communication',
      items: [
        { title: 'Messages', icon: 'fa-comments', path: '/admin/messages', badge: true },
        { title: 'Contact', icon: 'fa-address-card', path: '/admin/contact' },
        { title: 'Partenaires', icon: 'fa-handshake', path: '/admin/partenaires' },
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
  ]

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
        fixed top-0 left-0 h-screen w-64 bg-primary text-white shadow-2xl z-50
        transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Titre */}
        <div className="p-4 border-b border-blue-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full p-1 flex-shrink-0">
              <Image 
                src="/logo.jpeg" 
                alt="TLSTT" 
                width={40} 
                height={40}
                className="rounded-full"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg">TLSTT Admin</h2>
              <p className="text-xs text-blue-200">Back-office</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
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

        {/* Menu */}
        <nav className="p-3 overflow-y-auto h-[calc(100vh-200px)] scrollbar-thin">
          {menuSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive(item.path)
                        ? 'bg-white text-primary shadow-lg font-semibold'
                        : 'text-white/90 hover:bg-blue-800/50'
                    }`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center`}></i>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className={`w-2 h-2 rounded-full ${
                        isActive(item.path) ? 'bg-secondary' : 'bg-red-500'
                      }`}></span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-blue-800 bg-blue-900/20">
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
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-red-600 transition-all"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
