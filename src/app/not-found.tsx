import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page introuvable',
  description: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
}

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center max-w-lg">
        {/* Ping-pong ball animation */}
        <div className="relative mb-8">
          <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3b9fd8] to-[#2d8bc9] leading-none select-none">
            404
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-white rounded-full shadow-lg shadow-white/20 animate-bounce" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Balle perdue !
        </h1>
        <p className="text-gray-400 mb-8 text-lg leading-relaxed">
          La page que vous recherchez semble avoir quitte la table.
          <br className="hidden sm:block" />
          Elle n&apos;existe pas ou a ete deplacee.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-[#3b9fd8] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2d8bc9] transition-all hover:scale-105 flex items-center gap-2"
          >
            <i className="fas fa-home"></i>
            Retour a l&apos;accueil
          </Link>
          <Link
            href="/contact"
            className="border border-[#3b9fd8]/50 text-[#3b9fd8] px-8 py-3 rounded-lg font-semibold hover:bg-[#3b9fd8]/10 transition-all flex items-center gap-2"
          >
            <i className="fas fa-envelope"></i>
            Nous contacter
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm mb-4">Pages populaires</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/actualites/club" className="text-sm text-gray-400 hover:text-[#3b9fd8] transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10">
              Actualites
            </Link>
            <Link href="/joueurs" className="text-sm text-gray-400 hover:text-[#3b9fd8] transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10">
              Joueurs
            </Link>
            <Link href="/equipes" className="text-sm text-gray-400 hover:text-[#3b9fd8] transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10">
              Equipes
            </Link>
            <Link href="/planning" className="text-sm text-gray-400 hover:text-[#3b9fd8] transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10">
              Planning
            </Link>
            <Link href="/galerie" className="text-sm text-gray-400 hover:text-[#3b9fd8] transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10">
              Galerie
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
