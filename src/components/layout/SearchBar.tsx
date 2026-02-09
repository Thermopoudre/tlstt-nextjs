'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface SearchResult {
  type: 'article' | 'player' | 'newsletter'
  id: number
  title: string
  subtitle: string
  url: string
  image: string | null
}

const typeIcons: Record<string, string> = {
  article: 'fa-newspaper',
  player: 'fa-user',
  newsletter: 'fa-envelope-open-text',
}

const typeLabels: Record<string, string> = {
  article: 'Article',
  player: 'Joueur',
  newsletter: 'Newsletter',
}

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setResults(data.results || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:border-[#3b9fd8]/50 hover:text-white transition-all text-xs"
      >
        <i className="fas fa-search"></i>
        <span className="hidden lg:inline">Rechercher...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">
          Ctrl K
        </kbd>
      </button>

      {/* Search overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333]">
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-search'} text-[#3b9fd8]`}></i>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher un joueur, article, newsletter..."
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500"
                  autoFocus
                />
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xs">
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {query.length < 2 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    <i className="fas fa-search text-2xl mb-2 block opacity-30"></i>
                    Tapez au moins 2 caracteres...
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    <i className="fas fa-times-circle text-2xl mb-2 block opacity-30"></i>
                    Aucun resultat pour &quot;{query}&quot;
                  </div>
                ) : (
                  results.map((r, i) => (
                    <Link
                      key={`${r.type}-${r.id}`}
                      href={r.url}
                      onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-[#222] last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#3b9fd8]/10 flex items-center justify-center flex-shrink-0">
                        <i className={`fas ${typeIcons[r.type]} text-[#3b9fd8] text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{r.title}</div>
                        <div className="text-gray-500 text-xs truncate">{r.subtitle}</div>
                      </div>
                      <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                        {typeLabels[r.type]}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
