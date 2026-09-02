'use client'
import { motion, useInView } from 'framer-motion'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

const containerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

/** Indique aux enfants qu'on affiche sans animation (mode secours). */
const SansAnimation = createContext(false)

/**
 * Apparition en cascade des cartes d'une grille.
 *
 * Comme FadeInUp, un filet de sécurité affiche le contenu au bout de
 * 2 secondes si l'animation n'a pas pu démarrer : le contenu prime toujours
 * sur l'effet visuel.
 */
export function StaggerContainer({ children, className = '', staggerDelay = 0.1 }: StaggerContainerProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [secours, setSecours] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSecours(true), 2000)
    return () => clearTimeout(t)
  }, [])

  if (secours && !inView) {
    return (
      <SansAnimation.Provider value={true}>
        <div className={className}>{children}</div>
      </SansAnimation.Provider>
    )
  }

  return (
    <SansAnimation.Provider value={false}>
      <motion.div
        ref={ref}
        className={className}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        custom={staggerDelay}
      >
        {children}
      </motion.div>
    </SansAnimation.Provider>
  )
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const sansAnimation = useContext(SansAnimation)

  if (sansAnimation) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
