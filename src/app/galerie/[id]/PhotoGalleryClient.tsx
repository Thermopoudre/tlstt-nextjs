'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Photo {
  id: number
  url: string
  title?: string | null
  description?: string | null
  likes?: number
}

interface Props {
  photos: Photo[]
}

export default function PhotoGalleryClient({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }, [photos.length])

  const goNext = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i + 1) % photos.length))
  }, [photos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, closeLightbox, goPrev, goNext])

  // Bloquer le scroll quand le lightbox est ouvert
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <>
      {/* Grille de photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(index)}
            className="group relative aspect-square bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-colors cursor-pointer text-left w-full"
            aria-label={photo.title || `Photo ${index + 1}`}
          >
            <Image
              src={photo.url}
              alt={photo.title || `Photo ${photo.id}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                {photo.title && (
                  <h3 className="font-bold text-lg mb-1">{photo.title}</h3>
                )}
                {photo.description && (
                  <p className="text-sm text-gray-200 line-clamp-2">{photo.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm">
                  {(photo.likes ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <i className="fas fa-heart"></i>
                      {photo.likes}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <i className="fas fa-expand"></i>
                    Agrandir
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && currentPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse photo"
        >
          {/* Compteur */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Bouton fermer */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-[#3b9fd8] transition-colors backdrop-blur-sm z-10"
            aria-label="Fermer"
          >
            <i className="fas fa-times text-lg"></i>
          </button>

          {/* Flèche gauche */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-[#3b9fd8] transition-colors backdrop-blur-sm z-10"
              aria-label="Photo précédente"
            >
              <i className="fas fa-chevron-left text-xl"></i>
            </button>
          )}

          {/* Image principale */}
          <div
            className="relative w-full h-full flex items-center justify-center p-16"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative max-w-5xl w-full max-h-full" style={{ aspectRatio: 'auto' }}>
              <Image
                src={currentPhoto.url}
                alt={currentPhoto.title || `Photo ${currentPhoto.id}`}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Caption */}
          {(currentPhoto.title || currentPhoto.description) && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-8 py-6 pointer-events-none"
              onClick={e => e.stopPropagation()}
            >
              <div className="max-w-3xl mx-auto text-center">
                {currentPhoto.title && (
                  <h3 className="text-white font-bold text-xl mb-1">{currentPhoto.title}</h3>
                )}
                {currentPhoto.description && (
                  <p className="text-gray-300 text-sm">{currentPhoto.description}</p>
                )}
                {(currentPhoto.likes ?? 0) > 0 && (
                  <p className="text-[#3b9fd8] text-sm mt-2">
                    <i className="fas fa-heart mr-1"></i>
                    {currentPhoto.likes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Flèche droite */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); goNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-[#3b9fd8] transition-colors backdrop-blur-sm z-10"
              aria-label="Photo suivante"
            >
              <i className="fas fa-chevron-right text-xl"></i>
            </button>
          )}
        </div>
      )}
    </>
  )
}
