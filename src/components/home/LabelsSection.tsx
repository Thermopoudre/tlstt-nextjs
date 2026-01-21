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

export default function LabelsSection() {
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Si pas de labels, afficher des placeholders
  const displayLabels = labels.length > 0 ? labels : [
    { id: '1', name: 'Label École Française de Tennis de Table', description: 'Label FFTT certifiant la qualité de notre école de formation', image_url: '/images/labels/eftt.png', display_order: 1 },
    { id: '2', name: 'Club Formateur', description: 'Label reconnaissant notre engagement dans la formation', image_url: '/images/labels/club-formateur.png', display_order: 2 },
    { id: '3', name: 'Ping Santé', description: 'Programme santé et bien-être par le tennis de table', image_url: '/images/labels/ping-sante.png', display_order: 3 }
  ]

  return (
    <section className="py-12 bg-white">
      <div className="container-custom">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#0f3057] mb-2">
            <i className="fas fa-award mr-3 text-[#5bc0de]"></i>
            Nos Labels FFTT
          </h2>
          <p className="text-gray-600">Nos certifications et engagements qualité</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {displayLabels.map((label) => (
            <div 
              key={label.id} 
              className="group relative flex flex-col items-center"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 relative bg-white rounded-2xl shadow-lg p-4 border-2 border-[#5bc0de]/20 hover:border-[#5bc0de] transition-all hover:shadow-xl">
                <Image
                  src={label.image_url}
                  alt={label.name}
                  fill
                  className="object-contain p-2"
                  onError={(e) => {
                    // Fallback si image non trouvée
                    const target = e.target as HTMLImageElement
                    target.src = '/images/labels/placeholder.png'
                  }}
                />
              </div>
              <div className="mt-3 text-center max-w-[150px]">
                <h3 className="text-sm font-semibold text-[#0f3057]">{label.name}</h3>
              </div>
              
              {/* Tooltip */}
              {label.description && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[#0f3057] text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                  {label.description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0f3057]"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            <i className="fas fa-info-circle mr-1"></i>
            Ces labels sont délivrés par la Fédération Française de Tennis de Table
          </p>
        </div>
      </div>
    </section>
  )
}
