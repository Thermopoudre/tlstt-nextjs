'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from './AuthProvider'

export default function UserMenu() {
  const { user, profile, signOut, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
    )
  }

  if (!user) {
    return null // Le bouton de connexion est géré dans le Header
  }

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name?.[0] || ''}.`
    : user.email?.split('@')[0]

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || 'U'

  const isActive = profile?.membership_status === 'active'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#5bc0de] flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        <span className="text-white font-medium hidden sm:block">{displayName}</span>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
        )}
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-white/60 text-xs`}></i>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="font-semibold text-[#0f3057]">{profile?.first_name} {profile?.last_name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              <div className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {isActive ? 'Membre actif' : 'En attente de validation'}
              </div>
            </div>

            <div className="py-2">
              <Link
                href="/espace-membre"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-user-circle text-[#5bc0de]"></i>
                Mon Espace
              </Link>
              <Link
                href="/espace-membre/profil"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-cog text-[#5bc0de]"></i>
                Mon Profil
              </Link>
              <Link
                href="/boutique"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-shopping-bag text-[#5bc0de]"></i>
                Boutique Club
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-exchange-alt text-[#5bc0de]"></i>
                Marketplace
              </Link>
            </div>

            <div className="border-t py-2">
              <button
                onClick={() => {
                  signOut()
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <i className="fas fa-sign-out-alt"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
