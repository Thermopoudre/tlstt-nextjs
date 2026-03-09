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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all text-xs font-medium"
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <><i className="fas fa-sun text-sm"></i><span>Clair</span></>
      ) : (
        <><i className="fas fa-moon text-sm"></i><span>Sombre</span></>
      )}
    </button>
  )
}
