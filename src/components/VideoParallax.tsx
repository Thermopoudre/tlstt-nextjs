'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface VideoParallaxProps {
  youtubeId: string
  title?: string
  subtitle?: string
  height?: string
}

export default function VideoParallax({
  youtubeId,
  title,
  subtitle,
  height = '55vh',
}: VideoParallaxProps) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Déplace l'iframe de -12% à +12% pour l'effet parallax
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ height }}
    >
      {/* Iframe YouTube en fond — scale pour compenser le parallax */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Wrapper ratio 16:9 centré, couvre toute la section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] h-[100vh] min-w-full min-h-[56.25vw]">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            tabIndex={-1}
          />
        </div>
      </motion.div>

      {/* Overlay noir */}
      <div className="absolute inset-0 bg-[#0a0a0a]/75" />

      {/* Contenu optionnel par-dessus */}
      {(title || subtitle) && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-4">
            {title && (
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-white/80 drop-shadow">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
