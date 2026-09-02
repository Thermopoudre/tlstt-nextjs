'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // trace côté serveur pour le suivi
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-lg text-center">
        <div className="w-20 h-20 rounded-full bg-[#3b9fd8]/15 border border-[#3b9fd8]/40 flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-triangle-exclamation text-3xl text-[#3b9fd8]"></i>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Cette page n&apos;a pas pu s&apos;afficher</h1>
        <p className="text-gray-400 mb-8">
          Un incident technique passager nous empêche de charger le contenu. Réessayez dans un instant :
          le plus souvent, cela suffit.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
          >
            <i className="fas fa-rotate-right mr-2"></i>Réessayer
          </button>
          <Link
            href="/"
            className="bg-white/10 text-white px-6 py-3 rounded-full font-bold border border-white/25 hover:bg-white/20 transition-colors"
          >
            <i className="fas fa-house mr-2"></i>Retour à l&apos;accueil
          </Link>
          <Link
            href="/contact"
            className="text-gray-300 px-6 py-3 rounded-full font-semibold hover:text-white transition-colors"
          >
            Signaler le problème
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-600 mt-8">Référence technique : {error.digest}</p>
        )}
      </div>
    </div>
  )
}
