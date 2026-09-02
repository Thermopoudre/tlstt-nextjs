'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CarouselImage = {
  url: string
  title: string
  subtitle: string
  buttonText?: string
  buttonLink?: string
}

const aDuTexte = (img?: CarouselImage) => !!(img?.title?.trim() || img?.subtitle?.trim())

export default function HeroCarousel({ images, youtubeId }: { images: CarouselImage[]; youtubeId?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [images.length])

  const goToSlide = (index: number) => setCurrentIndex(index)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length)

  const slideCourant = images[currentIndex]
  const texteVisible = aDuTexte(slideCourant)

  return (
    <section className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-gradient-to-br from-[#10325F] via-[#0a1a2e] to-[#0a0a0a]">
      {/* Fond vidéo YouTube — plein écran, centré */}
      {youtubeId && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: 'max(130%, calc(130vh * 16 / 9))', aspectRatio: '16/9' }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
              tabIndex={-1}
            />
          </div>
        </div>
      )}

      {/* Images de fond superposées, fondu en CSS pur.
          Volontairement sans bibliothèque d'animation : le contenu du premier
          écran ne doit jamais dépendre du démarrage d'une animation JavaScript
          (onglet réveillé, économie d'énergie, animations réduites…). */}
      {!youtubeId && images.map((image, index) => (
        <div
          key={index}
          aria-hidden={index !== currentIndex}
          className={`absolute inset-0 z-0 bg-center bg-no-repeat transition-opacity duration-700 ${
            aDuTexte(image) ? 'bg-cover' : 'bg-contain'
          } ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${image.url})` }}
        />
      ))}

      {/* Voile : dense quand le slide porte du texte (lisibilité),
          quasi nul quand l'image se suffit à elle-même (affiche, bannière). */}
      <div
        className={`absolute inset-0 z-10 transition-all duration-700 ${
          texteVisible
            ? 'bg-gradient-to-b from-[#0a0a0a]/55 via-[#0a0a0a]/60 to-[#0a0a0a]/80'
            : 'bg-[#0a0a0a]/15'
        }`}
      />

      {/* Texte du slide courant */}
      {texteVisible && (
        <div key={currentIndex} className="absolute inset-0 z-20 flex items-center justify-center animate-fadeInUp">
          <div className="text-center px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 [text-shadow:0_2px_18px_rgba(0,0,0,.85)]">
              {slideCourant.title.split(' ').map((word, i) => {
                const isBlue =
                  word.toUpperCase() === 'TLSTT' ||
                  word.toLowerCase().includes('tennis') ||
                  word.toLowerCase().includes('table')
                return (
                  <span key={i} className={isBlue ? 'text-[#3b9fd8]' : 'text-white'}>
                    {word}{' '}
                  </span>
                )
              })}
            </h1>
            {slideCourant.subtitle && (
              <p className="text-xl md:text-2xl text-white/90 mb-8 [text-shadow:0_2px_12px_rgba(0,0,0,.9)]">
                {slideCourant.subtitle}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={slideCourant.buttonLink || '/club'}
                className="bg-[#3b9fd8] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#2d8bc9] transition-colors"
              >
                <i className="fas fa-arrow-right mr-2"></i>
                {slideCourant.buttonText || 'Découvrir'}
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors border border-white/30"
              >
                <i className="fas fa-envelope mr-2"></i>
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Diapositive précédente"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#3b9fd8] hover:border-[#3b9fd8] transition-colors"
          >
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
          <button
            onClick={nextSlide}
            aria-label="Diapositive suivante"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#3b9fd8] hover:border-[#3b9fd8] transition-colors"
          >
            <i className="fas fa-chevron-right text-xl"></i>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Aller à la diapositive ${index + 1}`}
                aria-current={index === currentIndex}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? 'bg-[#3b9fd8] w-8' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
