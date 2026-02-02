'use client'

import Link from 'next/link'
import { useState } from 'react'

const defaultImages: { [key: string]: string } = {
  'club': 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=800&q=80',
  'tt': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  'handisport': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80'
}

export default function NewsCard({ article }: { article: any }) {
  const [imgSrc, setImgSrc] = useState(
    article.photo_url || defaultImages[article.category] || defaultImages['default']
  )

  return (
    <Link
      href={`/actualites/${article.category}/${article.id}`}
      className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden group hover:border-[#3b9fd8] transition-all duration-300"
    >
      <div className="relative h-48 bg-[#111] overflow-hidden">
        <img
          src={imgSrc}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgSrc(defaultImages['default'])}
        />
        <div className="absolute top-3 left-3">
          <span className="bg-[#3b9fd8] text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <i className="fas fa-calendar text-[#3b9fd8]"></i>
          <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-[#3b9fd8] transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-400 text-sm line-clamp-3 mb-3">
            {article.excerpt}
          </p>
        )}
        <span className="text-[#3b9fd8] font-semibold text-sm flex items-center gap-1">
          Lire la suite
          <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
        </span>
      </div>
    </Link>
  )
}
