'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  date: string
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Vérifier si le consentement existe déjà
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Petit délai pour l'animation d'entrée
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [])

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setIsVisible(false)
  }

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      date: new Date().toISOString()
    })
  }

  const rejectOptional = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      date: new Date().toISOString()
    })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      <div className="max-w-4xl mx-auto bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl p-6 animate-slideUp">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-cookie-bite text-2xl text-white"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              <i className="fas fa-shield-alt mr-2 text-[#3b9fd8]"></i>
              Nous respectons votre vie privée
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
              Les cookies nécessaires sont indispensables au fonctionnement du site.
            </p>

            {/* Détails */}
            {showDetails && (
              <div className="mb-4 p-4 bg-[#111] border border-[#333] rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">Cookies nécessaires</span>
                      <p className="text-xs text-gray-500">Session, sécurité</p>
                    </div>
                    <span className="text-green-400 text-sm">Toujours actifs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">Cookies analytiques</span>
                      <p className="text-xs text-gray-500">Mesure d'audience anonyme</p>
                    </div>
                    <span className="text-gray-500 text-sm">Optionnel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">Cookies marketing</span>
                      <p className="text-xs text-gray-500">Réseaux sociaux, publicité</p>
                    </div>
                    <span className="text-gray-500 text-sm">Optionnel</span>
                  </div>
                </div>
              </div>
            )}

            {/* Liens */}
            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-[#3b9fd8] hover:underline"
              >
                <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'} mr-1`}></i>
                {showDetails ? 'Masquer' : 'En savoir plus'}
              </button>
              <Link href="/politique-cookies" className="text-gray-500 hover:text-[#3b9fd8]">
                Politique cookies
              </Link>
              <Link href="/politique-confidentialite" className="text-gray-500 hover:text-[#3b9fd8]">
                Confidentialité
              </Link>
            </div>

            {/* Boutons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={rejectOptional}
                className="px-5 py-2 border border-[#333] text-gray-400 rounded-lg hover:bg-[#222] hover:text-white transition-colors"
              >
                Refuser les optionnels
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2 bg-[#3b9fd8] text-white rounded-lg hover:bg-[#2d8bc9] transition-colors font-semibold"
              >
                <i className="fas fa-check mr-2"></i>
                Accepter tout
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
