'use client'

import { useState } from 'react'

interface FaqItem {
  id: number
  question: string
  answer: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-[#222] transition-colors"
          >
            <span className="font-semibold text-white pr-4">{item.question}</span>
            <i
              className={`fas fa-chevron-down text-[#3b9fd8] transition-transform duration-200 flex-shrink-0 ${
                openId === item.id ? 'rotate-180' : ''
              }`}
            ></i>
          </button>
          {openId === item.id && (
            <div className="px-5 pb-5 text-gray-400 leading-relaxed border-t border-[#333] pt-4">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
