'use client'

import { useEffect, useState } from 'react'

interface GraphiqueProgressionProps {
  history: any[]
}

export default function GraphiqueProgression({ history }: GraphiqueProgressionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !history || history.length < 2) {
    return null
  }

  const maxPoints = Math.max(...history.map(h => h.fftt_points))
  const minPoints = Math.min(...history.map(h => h.fftt_points))
  const range = maxPoints - minPoints || 1

  return (
    <div className="card mb-8">
      <h2 className="text-2xl font-bold text-primary mb-6">
        <i className="fas fa-chart-line mr-2"></i>
        Évolution du classement (12 derniers mois)
      </h2>

      {/* Graphique en barres */}
      <div className="mb-8">
        <div className="h-64 flex items-end justify-between gap-2 border-b-2 border-gray-300">
          {[...history].reverse().map((point, index) => {
            const height = ((point.fftt_points - minPoints) / range) * 100

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-primary to-blue-400 rounded-t-lg transition-all hover:from-secondary hover:to-red-400 cursor-pointer relative group"
                  style={{ height: `${Math.max(height, 10)}%` }}
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                    <div className="font-bold">{point.fftt_points} pts</div>
                    <div className="text-xs text-gray-300">
                      {new Date(point.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 -rotate-45 origin-top-left mt-2">
                  {new Date(point.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-semibold">Min:</span> {minPoints} pts
          </div>
          <div>
            <span className="font-semibold">Max:</span> {maxPoints} pts
          </div>
          <div>
            <span className="font-semibold">Écart:</span> {range} pts
          </div>
        </div>
      </div>

      {/* Graphique en ligne */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-bold text-gray-700 mb-4">Vue en ligne</h3>
        <svg className="w-full h-48" viewBox="0 0 1000 200">
          {/* Grille horizontale */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={200 - (y * 2)}
              x2="1000"
              y2={200 - (y * 2)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Ligne de progression */}
          <polyline
            points={[...history].reverse().map((point, index) => {
              const x = (index / (history.length - 1)) * 1000
              const y = 200 - (((point.fftt_points - minPoints) / range) * 180 + 10)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {[...history].reverse().map((point, index) => {
            const x = (index / (history.length - 1)) * 1000
            const y = 200 - (((point.fftt_points - minPoints) / range) * 180 + 10)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill="#10325F"
                className="hover:r-7 transition-all cursor-pointer"
              >
                <title>{point.fftt_points} pts - {new Date(point.date).toLocaleDateString('fr-FR')}</title>
              </circle>
            )
          })}

          {/* Gradient */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10325F" />
              <stop offset="100%" stopColor="#00BFFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
