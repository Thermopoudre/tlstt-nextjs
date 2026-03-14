'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FadeInUpProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export default function FadeInUp({ children, delay = 0, className = '' }: FadeInUpProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

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
