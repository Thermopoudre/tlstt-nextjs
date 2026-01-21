'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Competition {
  type: string
  equipe: string
  division: string
  adversaire: string
  domicile: boolean
  datePrevue: string
  dateReelle: string
  scoreTLSTT: string
  scoreAdverse: string
  joue: boolean
  libelle: string
}

export default function CompetitionsPage() {
  const [aVenir, setAVenir] = useState<Competition[]>([])
  const [passees, setPassees] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'avenir' | 'passees'>('avenir')

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fetch('/api/competitions')
        const data = await response.json()
        setAVenir(data.aVenir || [])
        setPassees(data.passees || [])
      } catch (error) {
        console.error('Erreur chargement compétitions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCompetitions()
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'À définir'
    // Déjà au format DD/MM/YYYY
    return dateStr
  }

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Compétitions</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-[#5bc0de]">Calendrier</span> des Compétitions
            </h1>
            <p className="text-white/70 text-lg">
              Toutes les rencontres officielles du TLSTT - Données FFTT en temps réel
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('avenir')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'avenir'
                  ? 'bg-[#5bc0de] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              À venir ({aVenir.length})
            </button>
            <button
              onClick={() => setActiveTab('passees')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'passees'
                  ? 'bg-[#5bc0de] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <i className="fas fa-history mr-2"></i>
              Résultats ({passees.length})
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
            <p className="text-white/60">Chargement des compétitions...</p>
          </div>
        ) : (
          <>
            {activeTab === 'avenir' && (
              <div className="space-y-4">
                {aVenir.length === 0 ? (
                  <div className="text-center py-12 bg-white/10 rounded-2xl">
                    <i className="fas fa-calendar-check text-6xl text-white/30 mb-4"></i>
                    <h3 className="text-xl font-bold text-white/80 mb-2">Aucune compétition à venir</h3>
                    <p className="text-white/60">Les prochaines dates seront affichées ici.</p>
                  </div>
                ) : (
                  aVenir.map((comp, index) => (
                    <div key={index} className="bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-[#5bc0de] text-white px-4 py-2 rounded-xl text-center min-w-[100px]">
                            <div className="text-2xl font-bold">{formatDate(comp.datePrevue).split('/')[0]}</div>
                            <div className="text-xs">{formatDate(comp.datePrevue).split('/').slice(1).join('/')}</div>
                          </div>
                          <div>
                            <div className="text-[#5bc0de] font-bold text-lg">{comp.equipe}</div>
                            <div className="text-white">
                              {comp.domicile ? (
                                <><span className="text-green-400">TLSTT</span> vs {comp.adversaire}</>
                              ) : (
                                <>{comp.adversaire} vs <span className="text-green-400">TLSTT</span></>
                              )}
                            </div>
                            <div className="text-white/50 text-sm">{comp.division}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comp.domicile ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                              <i className="fas fa-home mr-1"></i> Domicile
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                              <i className="fas fa-plane mr-1"></i> Extérieur
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'passees' && (
              <div className="space-y-4">
                {passees.length === 0 ? (
                  <div className="text-center py-12 bg-white/10 rounded-2xl">
                    <i className="fas fa-trophy text-6xl text-white/30 mb-4"></i>
                    <h3 className="text-xl font-bold text-white/80 mb-2">Aucun résultat</h3>
                    <p className="text-white/60">Les résultats des compétitions passées apparaîtront ici.</p>
                  </div>
                ) : (
                  passees.map((comp, index) => {
                    const victoire = parseInt(comp.scoreTLSTT) > parseInt(comp.scoreAdverse)
                    const defaite = parseInt(comp.scoreTLSTT) < parseInt(comp.scoreAdverse)
                    const nul = comp.scoreTLSTT === comp.scoreAdverse

                    return (
                      <div 
                        key={index} 
                        className={`border rounded-2xl p-6 ${
                          victoire ? 'bg-green-500/10 border-green-500/20' : 
                          defaite ? 'bg-red-500/10 border-red-500/20' : 
                          'bg-white/10 border-white/20'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-xl text-center min-w-[100px] ${
                              victoire ? 'bg-green-500 text-white' : 
                              defaite ? 'bg-red-500 text-white' : 
                              'bg-gray-500 text-white'
                            }`}>
                              <div className="text-2xl font-bold">
                                {comp.scoreTLSTT} - {comp.scoreAdverse}
                              </div>
                              <div className="text-xs">
                                {victoire ? 'VICTOIRE' : defaite ? 'DÉFAITE' : 'NUL'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#5bc0de] font-bold text-lg">{comp.equipe}</div>
                              <div className="text-white">
                                {comp.domicile ? (
                                  <><span className="text-green-400">TLSTT</span> vs {comp.adversaire}</>
                                ) : (
                                  <>{comp.adversaire} vs <span className="text-green-400">TLSTT</span></>
                                )}
                              </div>
                              <div className="text-white/50 text-sm">{comp.division}</div>
                            </div>
                          </div>
                          <div className="text-white/50 text-sm">
                            {formatDate(comp.dateReelle || comp.datePrevue)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}

        {/* Lien vers équipes */}
        <div className="mt-8 text-center">
          <Link href="/equipes" className="inline-flex items-center gap-2 px-6 py-3 bg-[#5bc0de] text-white rounded-full font-semibold hover:bg-[#4ab0ce] transition-colors">
            <i className="fas fa-users"></i>
            Voir les classements des équipes
          </Link>
        </div>
      </div>
    </div>
  )
}
