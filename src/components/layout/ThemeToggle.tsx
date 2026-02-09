'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    if (initial === 'light') {
      document.documentElement.classList.add('light-mode')
    }
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    if (next === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <i className="fas fa-sun text-sm"></i>
      ) : (
        <i className="fas fa-moon text-sm"></i>
      )}
    </button>
  )
}
