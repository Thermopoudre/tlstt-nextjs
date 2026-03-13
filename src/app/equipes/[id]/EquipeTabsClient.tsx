'use client'

import { useState } from 'react'

interface ClassementEntry {
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

interface PhaseData {
  classement: ClassementEntry[]
  rencontres: Rencontre[]
  error: string | null
}

interface EquipeTabsClientProps {
  hasPhase2: boolean
  phase1: PhaseData
  phase2: PhaseData
  teamName: string
  TLSTT_CLUB_NUMBER: string
}

export default function EquipeTabsClient({
  hasPhase2,
  phase1,
  phase2,
  teamName,
  TLSTT_CLUB_NUMBER,
}: EquipeTabsClientProps) {
  const [activePhase, setActivePhase] = useState<1 | 2>(1)

  const data = activePhase === 1 ? phase1 : phase2
  const { classement, rencontres, error } = data

  const equipeInfo = classement.find((e) => (TLSTT_CLUB_NUMBER && e.numero === TLSTT_CLUB_NUMBER) || e.equipe.toUpperCase().includes('SEYNE')) || null
  const equipePosition = equipeInfo?.clt || '-'
  const equipePoints = equipeInfo?.pts || '0'
  const equipeVic = equipeInfo?.vic || '0'
  const equipeNul = equipeInfo?.nul || '0'
  const equipeDef = equipeInfo?.def || '0'
  const equipeJoue = equipeInfo?.joue || '0'

  const tlsttRencontres = rencontres.filter(
    (r) =>
      r.equa.toUpperCase().includes('SEYNE') ||
      r.equa.toUpperCase().includes('TOULON') ||
      r.equb.toUpperCase().includes('SEYNE') ||
      r.equb.toUpperCase().includes('TOULON')
  )

  return (
    <>
      {/* Toggle Phase 1 / Phase 2 */}
      {hasPhase2 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-400 mr-2">Championnat :</span>
          <div className="flex bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <button
              onClick={() => setActivePhase(1)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                activePhase === 1
                  ? 'bg-[#3b9fd8] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#222]'
              }`}
            >
              Phase 1
            </button>
            <button
              onClick={() => setActivePhase(2)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                activePhase === 2
                  ? 'bg-[#3b9fd8] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#222]'
              }`}
            >
              Phase 2
            </button>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 mb-6 rounded-xl">
          <div className="flex">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3 mt-1"></i>
            <div>
              <p className="text-red-300 font-semibold">Erreur de chargement</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement de la poule */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#3b9fd8] mb-6 pb-4 border-b border-[#333]">
              <i className="fas fa-list-ol mr-2"></i>
              Classement de la Poule
              {hasPhase2 && (
                <span className="ml-3 text-sm font-normal text-gray-500">
                  — Phase {activePhase}
                </span>
              )}
            </h2>

            {classement.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#111]">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-400">Pos</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-400">Équipe</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-400">Pts</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-400">J</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-400">V</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-400">N</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-400">D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {classement.map((equipe, index) => {
                      const isTLSTT = (TLSTT_CLUB_NUMBER && equipe.numero === TLSTT_CLUB_NUMBER) || equipe.equipe.toUpperCase().includes('SEYNE')
                      return (
                        <tr
                          key={index}
                          className={`hover:bg-[#222] transition-colors ${
                            isTLSTT ? 'bg-[#3b9fd8]/10 font-semibold' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                isTLSTT
                                  ? 'bg-[#3b9fd8] text-white'
                                  : 'bg-[#333] text-gray-400'
                              }`}
                            >
                              {equipe.clt}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isTLSTT && (
                                <i className="fas fa-star text-yellow-500"></i>
                              )}
                              <span className={isTLSTT ? 'text-[#3b9fd8]' : 'text-white'}>
                                {equipe.equipe}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-[#3b9fd8]">
                            {equipe.pts}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-400">{equipe.joue}</td>
                          <td className="px-4 py-3 text-center text-green-500 font-semibold">
                            {equipe.vic}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">{equipe.nul}</td>
                          <td className="px-4 py-3 text-center text-red-500 font-semibold">
                            {equipe.def}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {error ? 'Impossible de charger le classement' : 'Aucun classement disponible'}
              </p>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#3b9fd8] mb-4">
              <i className="fas fa-chart-bar mr-2"></i>
              Statistiques TLSTT
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#333]">
                <span className="text-gray-400">Matchs joués</span>
                <span className="font-bold text-[#3b9fd8]">{equipeJoue}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#333]">
                <span className="text-gray-400">Victoires</span>
                <span className="font-bold text-green-500">{equipeVic}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#333]">
                <span className="text-gray-400">Nuls</span>
                <span className="font-bold text-gray-300">{equipeNul}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Défaites</span>
                <span className="font-bold text-red-500">{equipeDef}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] border-l-4 border-l-[#3b9fd8] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#3b9fd8] mb-3">
              <i className="fas fa-info-circle mr-2"></i>
              Infos pratiques
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-[#3b9fd8] mt-1"></i>
                <span>Données FFTT officielles en temps réel</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-[#3b9fd8] mt-1"></i>
                <span>Mise à jour toutes les 30 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-[#3b9fd8] mt-1"></i>
                <span>Résultats du week-end actualisés</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Résultats des matchs */}
      {tlsttRencontres.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mt-6">
          <h2 className="text-2xl font-bold text-[#3b9fd8] mb-6 pb-4 border-b border-[#333]">
            <i className="fas fa-calendar-check mr-2"></i>
            Résultats des Matchs
            {hasPhase2 && (
              <span className="ml-3 text-sm font-normal text-gray-500">
                — Phase {activePhase}
              </span>
            )}
          </h2>

          <div className="space-y-4">
            {tlsttRencontres.map((match, index) => {
              const isTLSTTa =
                match.equa.toUpperCase().includes('SEYNE') ||
                match.equa.toUpperCase().includes('TOULON')
              const hasScore = match.scorea !== '' && match.scoreb !== ''
              const scoreTLSTT = isTLSTTa ? match.scorea : match.scoreb
              const scoreAdv = isTLSTTa ? match.scoreb : match.scorea

              let resultClass = 'bg-[#222]'
              if (hasScore) {
                const sTLSTT = parseInt(scoreTLSTT)
                const sAdv = parseInt(scoreAdv)
                if (sTLSTT > sAdv) resultClass = 'bg-green-900/20 border-green-700/30'
                else if (sTLSTT < sAdv) resultClass = 'bg-red-900/20 border-red-700/30'
                else resultClass = 'bg-yellow-900/20 border-yellow-700/30'
              }

              return (
                <div
                  key={index}
                  className={`${resultClass} border border-[#333] rounded-xl p-4 hover:border-[#3b9fd8]/50 transition-all`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-2">
                        <i className="fas fa-calendar mr-1"></i>
                        {match.libelle}
                        {match.dateprevue && ` - ${match.dateprevue}`}
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-semibold ${
                            isTLSTTa ? 'text-[#3b9fd8]' : 'text-gray-200'
                          }`}
                        >
                          {match.equa}
                        </span>
                        <span className="text-gray-600">vs</span>
                        <span
                          className={`font-semibold ${
                            !isTLSTTa ? 'text-[#3b9fd8]' : 'text-gray-200'
                          }`}
                        >
                          {match.equb}
                        </span>
                      </div>
                    </div>

                    {hasScore ? (
                      <div className="bg-[#0a0a0a] rounded-lg px-6 py-3 font-bold text-2xl border border-[#333]">
                        <span
                          className={
                            parseInt(match.scorea) > parseInt(match.scoreb)
                              ? 'text-green-500'
                              : parseInt(match.scorea) < parseInt(match.scoreb)
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        >
                          {match.scorea}
                        </span>
                        <span className="text-gray-600 mx-2">-</span>
                        <span
                          className={
                            parseInt(match.scoreb) > parseInt(match.scorea)
                              ? 'text-green-500'
                              : parseInt(match.scoreb) < parseInt(match.scorea)
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        >
                          {match.scoreb}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-yellow-900/30 text-yellow-400 px-4 py-2 rounded-lg font-semibold border border-yellow-700/30">
                        <i className="fas fa-clock mr-1"></i> À venir
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tous les matchs de la poule (si pas de matchs TLSTT filtrés) */}
      {tlsttRencontres.length === 0 && rencontres.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mt-6">
          <h2 className="text-2xl font-bold text-[#3b9fd8] mb-6 pb-4 border-b border-[#333]">
            <i className="fas fa-calendar mr-2"></i>
            Tous les matchs de la poule
          </h2>
          <div className="space-y-3">
            {rencontres.map((match, index) => {
              const hasScore = match.scorea !== '' && match.scoreb !== ''
              return (
                <div
                  key={index}
                  className="bg-[#222] border border-[#333] rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs text-gray-600 mb-1">{match.libelle} - {match.dateprevue}</div>
                    <div className="text-sm">
                      <span className="text-gray-200">{match.equa}</span>
                      <span className="text-gray-600 mx-2">vs</span>
                      <span className="text-gray-200">{match.equb}</span>
                    </div>
                  </div>
                  {hasScore ? (
                    <div className="font-bold text-white">
                      {match.scorea} - {match.scoreb}
                    </div>
                  ) : (
                    <span className="text-xs text-yellow-400">À venir</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
