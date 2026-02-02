'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Competition {
  id: number
  date: string
  equipe: string
  adversaire: string
  lieu: string
  type: 'domicile' | 'exterieur'
  resultat?: string
}

export default function AdminCompetitionsPage() {
  const supabase = createClient()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => { fetchCompetitions() }, [])

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/competitions')
      const data = await response.json()
      setCompetitions(data.rencontres || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Compétitions</h1>
          <p className="text-gray-600 mt-1">Calendrier des matchs et résultats</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={fetchCompetitions}><i className="fas fa-sync"></i>Actualiser</button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {(['upcoming', 'past', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'upcoming' ? 'À venir' : f === 'past' ? 'Passés' : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
        ) : competitions.length === 0 ? (
          <div className="p-12 text-center text-gray-500"><i className="fas fa-calendar-times text-4xl mb-4"></i><p>Aucune compétition trouvée</p></div>
        ) : (
          <div className="divide-y">
            {competitions.map((comp, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-primary font-medium">{new Date(comp.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                      <span className="text-xl font-bold text-primary">{new Date(comp.date).getDate()}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{comp.equipe}</p>
                    <p className="text-gray-500">vs {comp.adversaire}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${comp.type === 'domicile' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      <i className={`fas ${comp.type === 'domicile' ? 'fa-home' : 'fa-car'}`}></i>
                      {comp.type === 'domicile' ? 'Domicile' : 'Extérieur'}
                    </span>
                    {comp.resultat && <p className="mt-1 font-bold text-primary">{comp.resultat}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
