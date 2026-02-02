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
          {/* Overlay - Noir avec opacité */}
          <div className="absolute inset-0 bg-[#0a0a0a]/90" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fadeInUp">
                {image.title.split(' ').map((word, i) => {
                  const isBlue = word.toUpperCase() === 'TLSTT' || word.toLowerCase().includes('tennis') || word.toLowerCase().includes('table')
                  return (
                    <span key={i} className={isBlue ? 'text-[#3b9fd8]' : 'text-white'}>
                      {word}{' '}
                    </span>
                  )
                })}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                {image.subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                {image.buttonText && image.buttonLink ? (
                  <Link
                    href={image.buttonLink}
                    className="bg-[#3b9fd8] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#2d8bc9] transition-colors"
                  >
                    <i className="fas fa-arrow-right mr-2"></i>
                    {image.buttonText}
                  </Link>
                ) : (
                  <Link
                    href="/club"
                    className="bg-[#3b9fd8] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#2d8bc9] transition-colors"
                  >
                    <i className="fas fa-arrow-right mr-2"></i>
                    Découvrir
                  </Link>
                )}
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
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#3b9fd8] hover:border-[#3b9fd8] transition-colors"
      >
        <i className="fas fa-chevron-left text-xl"></i>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#3b9fd8] hover:border-[#3b9fd8] transition-colors"
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
                ? 'bg-[#3b9fd8] w-8'
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
