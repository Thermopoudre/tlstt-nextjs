'use client'

import { useState, useEffect } from 'react'
import type { Locale } from '@/lib/i18n'

export default function LanguageSelector() {
  const [locale, setLocale] = useState<Locale>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLocale(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const toggle = () => {
    const next: Locale = locale === 'fr' ? 'en' : 'fr'
    setLocale(next)
    localStorage.setItem('locale', next)
    document.documentElement.lang = next
    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('locale-change', { detail: next }))
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold uppercase"
      title={locale === 'fr' ? 'Switch to English' : 'Passer en francais'}
    >
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}
