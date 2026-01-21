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

export default function HeroCarousel({ images }: { images: CarouselImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  const goToSlide = (index: number) => setCurrentIndex(index)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length)

  return (
    <section className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden">
      {/* Slides */}
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${image.url})` }}
          />
          {/* Overlay - Bleu marine TLSTT */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f3057]/95 via-[#1a5a8a]/85 to-[#2e86ab]/90" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fadeInUp">
                {image.title.split(' ').map((word, i) => (
                  <span key={i} className={word.toUpperCase() === 'TLSTT' || word.toLowerCase().includes('tennis') || word.toLowerCase().includes('table') ? 'text-[#f9c846]' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              <p className="text-xl md:text-2xl text-[#5bc0de] mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                {image.subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                {image.buttonText && image.buttonLink ? (
                  <Link
                    href={image.buttonLink}
                    className="bg-[#f9c846] text-[#0f3057] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#fbd872] hover:scale-105 transition-all shadow-lg"
                  >
                    <i className="fas fa-arrow-right mr-2"></i>
                    {image.buttonText}
                  </Link>
                ) : (
                  <Link
                    href="/club"
                    className="bg-[#f9c846] text-[#0f3057] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#fbd872] hover:scale-105 transition-all shadow-lg"
                  >
                    <i className="fas fa-info-circle mr-2"></i>
                    Découvrir le club
                  </Link>
                )}
                <Link
                  href="/contact"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#5bc0de]/30 transition-all border border-[#5bc0de]/50"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-[#f9c846]/50 hover:text-[#0f3057] transition-all"
      >
        <i className="fas fa-chevron-left text-xl"></i>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-[#f9c846]/50 hover:text-[#0f3057] transition-all"
      >
        <i className="fas fa-chevron-right text-xl"></i>
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-[#f9c846] w-8'
                : 'bg-white/50 hover:bg-[#5bc0de]'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
