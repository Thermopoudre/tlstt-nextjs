'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté/refusé les cookies
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Attendre un peu avant d'afficher la bannière
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      date: new Date().toISOString()
    }))
    setShowBanner(false)
  }

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      date: new Date().toISOString()
    }))
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slideUp">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-cookie-bite text-2xl text-primary"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                <i className="fas fa-shield-alt text-green-600 mr-2"></i>
                Respect de votre vie privée
              </h3>
              <p className="text-sm text-gray-600">
                Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
                Certains cookies sont essentiels au fonctionnement du site, d'autres nous aident à 
                comprendre comment vous l'utilisez.
              </p>
            </div>
          </div>

          {/* Détails (accordéon) */}
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Cookies essentiels</p>
                  <p className="text-xs text-gray-500">Nécessaires au fonctionnement du site</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Toujours actifs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Cookies analytiques</p>
                  <p className="text-xs text-gray-500">Nous aident à améliorer le site</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Optionnels
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Cookies marketing</p>
                  <p className="text-xs text-gray-500">Pour des publicités personnalisées</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  Optionnels
                </span>
              </div>
            </div>
          )}

          {/* Liens */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-primary hover:underline font-medium"
            >
              <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'} mr-1`}></i>
              {showDetails ? 'Masquer les détails' : 'En savoir plus'}
            </button>
            <Link href="/politique-cookies" className="text-gray-500 hover:text-primary">
              Politique des cookies
            </Link>
            <Link href="/politique-confidentialite" className="text-gray-500 hover:text-primary">
              Confidentialité
            </Link>
          </div>
        </div>

        {/* Boutons */}
        <div className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={acceptNecessary}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Refuser les optionnels
          </button>
          <button
            onClick={acceptAll}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            <i className="fas fa-check mr-2"></i>
            Accepter tout
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
