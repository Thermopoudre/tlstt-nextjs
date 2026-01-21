'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Classement {
  poule: string
  clt: string
  equipe: string
  joue: string
  pts: string
  numero: string
  vic: string
  def: string
  nul: string
  pf: string
  pg: string
  pp: string
}

interface Rencontre {
  libelle: string
  equa: string
  equb: string
  scorea: string
  scoreb: string
  dateprevue: string
  datereelle: string
  lien: string
}

interface Equipe {
  libequipe: string
  libdivision: string
  liendivision: string
  idepr: string
  libepr: string
  cx_poule: string
  D1: string
  classement: Classement[]
  rencontres: Rencontre[]
}

export default function EquipesPage() {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEquipe, setSelectedEquipe] = useState<number>(0)

  useEffect(() => {
    const fetchEquipes = async () => {
      try {
        const response = await fetch('/api/equipes/tlstt')
        const data = await response.json()
        setEquipes(data.equipes || [])
      } catch (error) {
        console.error('Erreur chargement équipes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEquipes()
  }, [])

  const currentEquipe = equipes[selectedEquipe]

  // Trouver la position de TLSTT dans le classement
  const tlsttPosition = currentEquipe?.classement.find(c => 
    c.equipe.toUpperCase().includes('SEYNE') || 
    c.equipe.toUpperCase().includes('TLSTT') ||
    c.numero === '08830142'
  )

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Équipes</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nos <span className="text-[#5bc0de]">Équipes</span>
            </h1>
            <p className="text-white/70 text-lg">
              Résultats et classements du championnat par équipes
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
            <p className="text-white/60">Chargement des équipes...</p>
          </div>
        ) : equipes.length === 0 ? (
          <div className="text-center py-12 bg-white/10 rounded-2xl">
            <i className="fas fa-users text-6xl text-white/30 mb-4"></i>
            <h3 className="text-xl font-bold text-white/80 mb-2">Aucune équipe trouvée</h3>
            <p className="text-white/60">Les données des équipes ne sont pas encore disponibles.</p>
          </div>
        ) : (
          <>
            {/* Sélecteur d'équipe */}
            <div className="flex flex-wrap gap-2 mb-8">
              {equipes.map((equipe, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEquipe(index)}
                  className={`px-4 py-2 rounded-full font-semibold transition-all ${
                    selectedEquipe === index
                      ? 'bg-[#5bc0de] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {equipe.libequipe}
                </button>
              ))}
            </div>

            {currentEquipe && (
              <>
                {/* Info équipe */}
                <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {currentEquipe.libequipe}
                      </h2>
                      <div className="text-white/60">
                        <i className="fas fa-trophy mr-2 text-[#5bc0de]"></i>
                        {currentEquipe.libdivision}
                      </div>
                      <div className="text-white/50 text-sm mt-1">
                        {currentEquipe.libepr}
                      </div>
                    </div>
                    {tlsttPosition && (
                      <div className="bg-[#5bc0de]/20 rounded-xl p-4 text-center">
                        <div className="text-4xl font-bold text-[#5bc0de]">
                          {tlsttPosition.clt}<sup>ème</sup>
                        </div>
                        <div className="text-white/60 text-sm">Position</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Classement */}
                {currentEquipe.classement.length > 0 && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                      <i className="fas fa-list-ol mr-2 text-[#5bc0de]"></i>
                      Classement - {currentEquipe.classement[0]?.poule || currentEquipe.libdivision}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="px-3 py-3 text-left text-sm font-semibold text-white/70">Pos</th>
                            <th className="px-3 py-3 text-left text-sm font-semibold text-white/70">Équipe</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">J</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">V</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">N</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">D</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">PG</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">PP</th>
                            <th className="px-3 py-3 text-center text-sm font-semibold text-white/70">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {currentEquipe.classement.map((cl, index) => {
                            const isTLSTT = cl.equipe.toUpperCase().includes('SEYNE') || 
                                           cl.equipe.toUpperCase().includes('TLSTT') ||
                                           cl.numero === '08830142'
                            return (
                              <tr 
                                key={index} 
                                className={`${isTLSTT ? 'bg-[#5bc0de]/20' : 'hover:bg-white/5'} transition-colors`}
                              >
                                <td className="px-3 py-3 text-white font-bold">{cl.clt}</td>
                                <td className={`px-3 py-3 ${isTLSTT ? 'text-[#5bc0de] font-bold' : 'text-white'}`}>
                                  {cl.equipe}
                                  {isTLSTT && <i className="fas fa-star ml-2 text-yellow-400"></i>}
                                </td>
                                <td className="px-3 py-3 text-center text-white/70">{cl.joue}</td>
                                <td className="px-3 py-3 text-center text-green-400">{cl.vic}</td>
                                <td className="px-3 py-3 text-center text-white/50">{cl.nul}</td>
                                <td className="px-3 py-3 text-center text-red-400">{cl.def}</td>
                                <td className="px-3 py-3 text-center text-green-400">{cl.pg}</td>
                                <td className="px-3 py-3 text-center text-red-400">{cl.pp}</td>
                                <td className="px-3 py-3 text-center text-[#5bc0de] font-bold">{cl.pts}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Rencontres */}
                {currentEquipe.rencontres.length > 0 && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      <i className="fas fa-calendar-alt mr-2 text-[#5bc0de]"></i>
                      Rencontres
                    </h3>
                    <div className="space-y-3">
                      {currentEquipe.rencontres.map((renc, index) => {
                        const isTLSTTa = renc.equa.toUpperCase().includes('SEYNE') || renc.equa.toUpperCase().includes('TLSTT')
                        const isTLSTTb = renc.equb.toUpperCase().includes('SEYNE') || renc.equb.toUpperCase().includes('TLSTT')
                        const hasScore = renc.scorea && renc.scoreb
                        const tlsttWon = hasScore && (
                          (isTLSTTa && parseInt(renc.scorea) > parseInt(renc.scoreb)) ||
                          (isTLSTTb && parseInt(renc.scoreb) > parseInt(renc.scorea))
                        )
                        const tlsttLost = hasScore && (
                          (isTLSTTa && parseInt(renc.scorea) < parseInt(renc.scoreb)) ||
                          (isTLSTTb && parseInt(renc.scoreb) < parseInt(renc.scorea))
                        )

                        return (
                          <div 
                            key={index} 
                            className={`p-4 rounded-xl ${hasScore ? (tlsttWon ? 'bg-green-500/10 border border-green-500/20' : tlsttLost ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5') : 'bg-white/5 border border-white/10'}`}
                          >
                            <div className="text-white/50 text-xs mb-2">{renc.libelle}</div>
                            <div className="flex items-center justify-between">
                              <div className={`flex-1 text-right ${isTLSTTa ? 'text-[#5bc0de] font-bold' : 'text-white'}`}>
                                {renc.equa}
                              </div>
                              <div className="px-4 mx-4 text-center min-w-[80px]">
                                {hasScore ? (
                                  <span className="text-2xl font-bold">
                                    <span className={isTLSTTa ? 'text-[#5bc0de]' : 'text-white'}>{renc.scorea}</span>
                                    <span className="text-white/30 mx-1">-</span>
                                    <span className={isTLSTTb ? 'text-[#5bc0de]' : 'text-white'}>{renc.scoreb}</span>
                                  </span>
                                ) : (
                                  <span className="text-white/50 text-sm">
                                    {renc.dateprevue || 'À venir'}
                                  </span>
                                )}
                              </div>
                              <div className={`flex-1 text-left ${isTLSTTb ? 'text-[#5bc0de] font-bold' : 'text-white'}`}>
                                {renc.equb}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
