'use client'
import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface FadeInUpProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/**
 * Apparition en fondu à l'entrée dans l'écran.
 *
 * Filet de sécurité : si l'animation n'a pas démarré au bout de 2 secondes
 * (onglet réveillé, économie d'énergie, animations bloquées par le navigateur),
 * le contenu est affiché tel quel. Un visiteur ne doit jamais tomber sur une
 * page vide parce qu'une animation n'a pas tourné.
 */
export default function FadeInUp({ children, delay = 0, className = '' }: FadeInUpProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [secours, setSecours] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSecours(true), 2000)
    return () => clearTimeout(t)
  }, [])

  if (secours && !inView) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
