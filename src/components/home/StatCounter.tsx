'use client'

import { useEffect, useRef, useState } from 'react'

interface StatCounterProps {
  value: number | null
  suffix?: string
}

export default function StatCounter({ value, suffix = '' }: StatCounterProps) {
  const target = value ?? 0
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (target === 0) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1200
          const steps = 40
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current = Math.min(current + increment, target)
            setCount(Math.round(current))
            if (current >= target) clearInterval(timer)
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-4xl font-bold text-white mb-1">
      {target === 0 ? '–' : count}{suffix}
    </div>
  )
}
