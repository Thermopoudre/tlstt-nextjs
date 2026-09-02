'use client'

import { useEffect } from 'react'

type Props = {
  ouvert: boolean
  onFermer: () => void
  titre: string
  chapeau: string
  contenuHtml: string
  imageUrl?: string
  categorie: string
}

const LIBELLE: Record<string, string> = {
  club: 'Vie du club',
  tt: 'Tennis de table',
  handi: 'Handisport',
}

/**
 * Aperçu de l'article tel qu'il apparaîtra sur le site public.
 * Reprend le fond sombre et la typographie du site pour éviter les surprises
 * après publication.
 */
export default function ApercuArticle({
  ouvert,
  onFermer,
  titre,
  chapeau,
  contenuHtml,
  imageUrl,
  categorie,
}: Props) {
  useEffect(() => {
    if (!ouvert) return
    const onTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', onTouche)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onTouche)
      document.body.style.overflow = overflow
    }
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu de l'article"
      onClick={onFermer}
    >
      <div
        className="relative w-full sm:max-w-3xl bg-[#0a0a0a] sm:rounded-2xl overflow-hidden shadow-2xl my-0 sm:my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Barre d'aperçu */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#111] border-b border-[#2a2a2a] px-4 sm:px-6 py-3">
          <p className="text-sm text-gray-300">
            <i className="fas fa-eye mr-2 text-[#3b9fd8]"></i>
            Aperçu — voici ce que verront les visiteurs
          </p>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer l'aperçu"
            className="text-gray-400 hover:text-white transition-colors px-2 py-1"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <article className="apercu-article px-4 sm:px-8 py-6 sm:py-8">
          <span className="inline-block bg-[#3b9fd8] text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
            {LIBELLE[categorie] || 'Actualité'}
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-4 mb-3 leading-tight">
            {titre || <span className="text-gray-600">(titre à renseigner)</span>}
          </h1>

          <p className="text-xs text-gray-500 mb-6">
            <i className="fas fa-calendar mr-1.5"></i>
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            <span className="mx-2">·</span>
            <i className="fas fa-user mr-1.5"></i>Rédaction
          </p>

          {chapeau && (
            <p className="border-l-4 border-[#3b9fd8] pl-4 text-lg text-gray-200 mb-6 leading-relaxed">
              {chapeau}
            </p>
          )}

          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="w-full rounded-xl mb-6 max-h-[420px] object-cover bg-[#1a1a1a]"
            />
          )}

          {contenuHtml && contenuHtml !== '<p></p>' ? (
            <div
              className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-[#3b9fd8] prose-strong:text-white prose-li:text-gray-300"
              dangerouslySetInnerHTML={{ __html: contenuHtml }}
            />
          ) : (
            <p className="text-gray-600 italic">(le contenu de l&apos;article apparaîtra ici)</p>
          )}
        </article>

        <div className="border-t border-[#2a2a2a] px-4 sm:px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onFermer}
            className="bg-[#3b9fd8] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#2d8bc9] transition-colors"
          >
            Revenir à la rédaction
          </button>
        </div>
      </div>
    </div>
  )
}
