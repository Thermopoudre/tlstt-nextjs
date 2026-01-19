'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

interface AdminSidebarProps {
  admin: any
}

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'fa-home',
      path: '/admin',
    },
    {
      title: 'Actualités',
      icon: 'fa-newspaper',
      path: '/admin/actualites',
      badge: '3',
    },
    {
      title: 'Planning',
      icon: 'fa-calendar-alt',
      path: '/admin/planning',
    },
    {
      title: 'Joueurs & Équipes',
      icon: 'fa-users',
      path: '/admin/joueurs',
    },
    {
      title: 'Galerie',
      icon: 'fa-images',
      path: '/admin/galerie',
    },
    {
      title: 'Newsletter',
      icon: 'fa-envelope',
      path: '/admin/newsletter',
    },
    {
      title: 'Pages',
      icon: 'fa-file-alt',
      path: '/admin/pages',
    },
    {
      title: 'Partenaires',
      icon: 'fa-handshake',
      path: '/admin/partenaires',
    },
    {
      title: 'Messages',
      icon: 'fa-comments',
      path: '/admin/messages',
      badge: '5',
    },
    {
      title: 'Paramètres',
      icon: 'fa-cog',
      path: '/admin/parametres',
    },
  ]

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-primary text-white shadow-2xl z-50">
      {/* Logo & Titre */}
      <div className="p-6 border-b border-blue-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full p-1">
            <Image 
              src="/logo.jpeg" 
              alt="TLSTT" 
              width={48} 
              height={48}
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
      <div className="p-4 border-b border-blue-800 bg-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
            {admin.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{admin.name || 'Admin'}</p>
            <p className="text-xs text-blue-200 truncate">{admin.role || 'Administrateur'}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-250px)]">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.path)
                ? 'bg-white text-primary shadow-lg'
                : 'text-white hover:bg-blue-800'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="flex-1 font-medium">{item.title}</span>
            {item.badge && (
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                isActive(item.path)
                  ? 'bg-secondary text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-600 transition-all"
        >
          <i className="fas fa-sign-out-alt w-5"></i>
          <span className="font-medium">Déconnexion</span>
        </Link>
      </div>
    </aside>
  )
}
