'use client'

import { useState } from 'react'

export default function PartnerCard({ partner }: { partner: any }) {
  const [showText, setShowText] = useState(!partner.logo_url)

  return (
    <a
      href={partner.website_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center min-w-[150px] h-20"
      title={partner.name}
    >
      {partner.logo_url && !showText ? (
        <img 
          src={partner.logo_url} 
          alt={partner.name} 
          className="max-h-12 max-w-[120px] object-contain"
          onError={() => setShowText(true)}
        />
      ) : (
        <span className="font-bold text-[#0f3057] text-center text-sm">
          {partner.name}
        </span>
      )}
    </a>
  )
}
