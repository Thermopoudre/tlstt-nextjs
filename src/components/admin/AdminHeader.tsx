'use client'

import Link from 'next/link'

interface AdminHeaderProps {
  admin: any
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">
            Bienvenue, {admin.name || 'Admin'} !
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez votre site TLSTT depuis ce tableau de bord
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
            <i className="fas fa-bell text-xl"></i>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Messages */}
          <button className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
            <i className="fas fa-envelope text-xl"></i>
            <span className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-1.5 rounded-full">
              5
            </span>
          </button>

          {/* Voir le site */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            <i className="fas fa-external-link-alt"></i>
            <span className="font-medium">Voir le site</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
