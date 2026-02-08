'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Label {
  id: string
  name: string
  description: string | null
  image_url: string
  display_order: number
}

// Icônes par défaut pour les labels connus
const LABEL_ICONS: Record<string, { icon: string; gradient: string }> = {
  'école': { icon: 'fas fa-graduation-cap', gradient: 'from-blue-500 to-blue-700' },
  'formateur': { icon: 'fas fa-chalkboard-teacher', gradient: 'from-green-500 to-green-700' },
  'santé': { icon: 'fas fa-heartbeat', gradient: 'from-red-400 to-pink-600' },
  'durable': { icon: 'fas fa-leaf', gradient: 'from-emerald-500 to-emerald-700' },
}

function getLabelStyle(name: string) {
  const nameLower = name.toLowerCase()
  for (const [key, style] of Object.entries(LABEL_ICONS)) {
    if (nameLower.includes(key)) return style
  }
  return { icon: 'fas fa-award', gradient: 'from-[#3b9fd8] to-blue-700' }
}

export default function LabelsSection() {
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchLabels = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('labels')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      setLabels(data || [])
      setIsLoading(false)
    }
    fetchLabels()
  }, [])

  const displayLabels = labels.length > 0 ? labels : [
    { id: '1', name: 'École Française de Tennis de Table', description: 'Label FFTT certifiant la qualité de notre école de formation', image_url: '', display_order: 1 },
    { id: '2', name: 'Club Formateur', description: 'Label reconnaissant notre engagement dans la formation des jeunes', image_url: '', display_order: 2 },
    { id: '3', name: 'Ping Santé', description: 'Programme santé et bien-être par le tennis de table', image_url: '', display_order: 3 }
  ]

  const handleImageError = (labelId: string) => {
    setFailedImages(prev => new Set(prev).add(labelId))
  }

  const shouldShowBadge = (label: Label) => {
    return !label.image_url || 
           label.image_url.includes('placeholder') || 
           failedImages.has(label.id)
  }

  return (
    <section className="py-16 bg-[#111111]">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            <i className="fas fa-award mr-3 text-[#3b9fd8]"></i>
            Nos Labels FFTT
          </h2>
          <p className="text-gray-500">Certifications et engagements qualité décernés par la Fédération</p>
        </div>

        <div className="flex flex-wrap justify-center items-stretch gap-8 md:gap-10">
          {displayLabels.map((label) => {
            const style = getLabelStyle(label.name)
            const showBadge = shouldShowBadge(label)

            return (
              <div
                key={label.id}
                className="group relative flex flex-col items-center w-44 md:w-52"
              >
                {/* Badge / Image */}
                <div className="w-36 h-36 md:w-44 md:h-44 relative rounded-2xl shadow-lg border border-[#333] hover:border-[#3b9fd8] transition-all hover:shadow-[0_0_20px_rgba(59,159,216,0.3)] hover:scale-105 overflow-hidden">
                  {showBadge ? (
                    /* Badge stylisé avec icône */
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center p-4`}>
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 border-2 border-white/40">
                        <i className={`${style.icon} text-3xl md:text-4xl text-white`}></i>
                      </div>
                      <div className="text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight">
                        FFTT
                      </div>
                    </div>
                  ) : (
                    /* Image réelle */
                    <Image
                      src={label.image_url}
                      alt={label.name}
                      fill
                      className="object-contain p-3"
                      onError={() => handleImageError(label.id)}
                    />
                  )}
                </div>

                {/* Nom du label */}
                <div className="mt-4 text-center">
                  <h3 className="text-sm font-semibold text-white leading-tight">{label.name}</h3>
                </div>

                {/* Tooltip au hover */}
                {label.description && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[#3b9fd8] text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-lg">
                    {label.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#3b9fd8]"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-500 text-sm">
            <i className="fas fa-info-circle mr-1 text-[#3b9fd8]"></i>
            Ces labels sont délivrés par la{' '}
            <a
              href="https://www.fftt.com/site/jouer/services-clubs/labels-clubs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3b9fd8] hover:underline"
            >
              Fédération Française de Tennis de Table
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
