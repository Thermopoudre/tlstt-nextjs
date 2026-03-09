'use client'

import { useState, useEffect } from 'react'

interface Props {
  newsId: number | string
}

export default function LikeButton({ newsId }: Props) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    fetch(`/api/news/${newsId}/like`)
      .then(r => r.json())
      .then(d => {
        setCount(d.count ?? 0)
        setLiked(d.hasLiked ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [newsId])

  const handleLike = async () => {
    if (loading) return
    setLoading(true)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 600)

    try {
      const res = await fetch(`/api/news/${newsId}/like`, { method: 'POST' })
      const data = await res.json()
      setLiked(data.liked)
      setCount(data.count ?? count)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 select-none ${
        liked
          ? 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25'
          : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-red-500/40 hover:text-red-400'
      }`}
      title={liked ? 'Retirer mon like' : 'Liker cet article'}
    >
      <i
        className={`${liked ? 'fas' : 'far'} fa-heart transition-transform duration-200 ${
          animating ? 'scale-150' : 'scale-100'
        } ${loading ? 'opacity-50' : ''}`}
      ></i>
      <span className="text-sm font-medium">
        {loading ? '...' : count > 0 ? count : 'J\'aime'}
      </span>
    </button>
  )
}
