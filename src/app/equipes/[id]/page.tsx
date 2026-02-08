import { SmartPingAPI } from '@/lib/smartping/api'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 1800 // Revalider toutes les 30 minutes

const TLSTT_CLUB_NUMBER = '13830083'

interface PageProps {
  params: Promise<{ id: string }>
}

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

function parseClassementXml(xml: string): ClassementEntry[] {
  if (!xml || xml.includes('<erreur>')) return []

  const classements: ClassementEntry[] = []
  const matches = xml.matchAll(/<classement>([\s\S]*?)<\/classement>/g)

  for (const match of matches) {
    const clXml = match[1]
    const getValue = (tag: string): string => {
      const m = clXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }

    classements.push({
      clt: getValue('clt'),
      equipe: getValue('equipe'),
      joue: getValue('joue'),
      pts: getValue('pts'),
      numero: getValue('numero'),
      vic: getValue('vic'),
      def: getValue('def'),
      nul: getValue('nul'),
      pf: getValue('pf'),
      pg: getValue('pg'),
      pp: getValue('pp'),
    })
  }

  return classements
}

function parseRencontresXml(xml: string): Rencontre[] {
  if (!xml || xml.includes('<erreur>')) return []

  const rencontres: Rencontre[] = []
  const matches = xml.matchAll(/<tour>([\s\S]*?)<\/tour>/g)

  for (const match of matches) {
    const tourXml = match[1]
    const getValue = (tag: string): string => {
      const m = tourXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }

    rencontres.push({
      libelle: getValue('libelle'),
      equa: getValue('equa'),
      equb: getValue('equb'),
      scorea: getValue('scorea'),
      scoreb: getValue('scoreb'),
      dateprevue: getValue('dateprevue'),
      datereelle: getValue('datereelle'),
      lien: getValue('lien'),
    })
  }

  return rencontres
}

function parseEquipesXml(xml: string): Array<{ libequipe: string; libdivision: string; liendivision: string }> {
  if (!xml || xml.includes('<erreur>')) return []

  const equipes: Array<{ libequipe: string; libdivision: string; liendivision: string }> = []
  const matches = xml.matchAll(/<equipe>([\s\S]*?)<\/equipe>/g)

  for (const match of matches) {
    const equipeXml = match[1]
    const getValue = (tag: string): string => {
      const m = equipeXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : ''
    }

    equipes.push({
      libequipe: getValue('libequipe'),
      libdivision: getValue('libdivision'),
      liendivision: getValue('liendivision'),
    })
  }

  return equipes
}

export default async function EquipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const api = new SmartPingAPI()

  let classement: ClassementEntry[] = []
  let rencontres: Rencontre[] = []
  let teamName = ''
  let teamDivision = ''
  let teamPool = ''
  let error = null

  try {
    // 1. Récupérer les infos de l'équipe depuis Supabase
    const supabase = await createClient()
    const { data: teamFromDb } = await supabase
      .from('teams')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (!teamFromDb) {
      notFound()
    }

    teamName = teamFromDb.name || `TLSTT ${id}`
    teamDivision = teamFromDb.division || ''
    teamPool = teamFromDb.pool || ''

    // 2. Récupérer les équipes du club depuis l'API FFTT pour avoir D1 et cx_poule
    const equipesXml = await api.getEquipes(TLSTT_CLUB_NUMBER)
    const equipesFFTT = parseEquipesXml(equipesXml)

    // 3. Trouver l'équipe correspondante dans les données FFTT
    // Matching par nom (ex: "TOULON LA SEYNE 1" pour "TLSTT 1")
    const teamNumber = teamName.replace(/TLSTT\s*/i, '').trim()
    const matchingEquipe = equipesFFTT.find((eq) => {
      const ffttNumber = eq.libequipe.replace(/.*?(\d+)\s*$/, '$1').trim()
      return ffttNumber === teamNumber
    })

    if (!matchingEquipe) {
      error = `Équipe "${teamName}" non trouvée dans les données FFTT (${equipesFFTT.length} équipes trouvées)`
      // On continue quand même pour afficher ce qu'on peut
    } else {
      // 4. Extraire D1 et cx_poule depuis liendivision
      const params = new URLSearchParams(matchingEquipe.liendivision)
      const D1 = params.get('D1') || ''
      const cx_poule = params.get('cx_poule') || ''

      teamDivision = matchingEquipe.libdivision || teamDivision

      if (D1 && cx_poule) {
        // 5. Récupérer le classement de la poule
        try {
          const classementXml = await api.getClassementPoule(D1, cx_poule)
          classement = parseClassementXml(classementXml)
        } catch (e: any) {
          console.error('Erreur classement:', e.message)
        }

        // 6. Récupérer les rencontres (résultats)
        try {
          const rencontresXml = await api.getResultatsPoule(D1, cx_poule)
          rencontres = parseRencontresXml(rencontresXml)
        } catch (e: any) {
          console.error('Erreur rencontres:', e.message)
        }
      } else {
        error = `Paramètres D1/cx_poule manquants pour ${teamName}`
      }
    }
  } catch (e: any) {
    error = e.message
    console.error('Erreur API équipe:', e)
  }

  // Trouver l'info de l'équipe TLSTT dans le classement
  const equipeInfo = classement.find((e) => e.numero === TLSTT_CLUB_NUMBER) || null
  const equipePosition = equipeInfo?.clt || '-'
  const equipePoints = equipeInfo?.pts || '0'
  const equipeVic = equipeInfo?.vic || '0'
  const equipeNul = equipeInfo?.nul || '0'
  const equipeDef = equipeInfo?.def || '0'
  const equipeJoue = equipeInfo?.joue || '0'

  // Filtrer les rencontres TLSTT
  const tlsttRencontres = rencontres.filter(
    (r) =>
      r.equa.toUpperCase().includes('SEYNE') ||
      r.equa.toUpperCase().includes('TOULON') ||
      r.equb.toUpperCase().includes('SEYNE') ||
      r.equb.toUpperCase().includes('TOULON')
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/equipes"
            className="text-[#3b9fd8] hover:text-[#5bc0de] mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Retour aux équipes
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <i className="fas fa-users mr-2 text-[#3b9fd8]"></i>
                {teamName}
              </h1>
              <p className="text-white/70 text-lg">
                {teamDivision}
                {teamPool && ` - Poule ${teamPool}`}
              </p>
            </div>
            {equipeInfo && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-[#3b9fd8]">{equipePosition}</div>
                  <div className="text-sm text-white/60">Classement</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">{equipePoints}</div>
                  <div className="text-sm text-white/60">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-green-500">{equipeVic}</div>
                  <div className="text-sm text-white/60">Victoires</div>
                </div>
              </div>
            )}
          </div>
        </div>

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
              </h2>

              {classement.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#111]">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-white/70">Pos</th>
                        <th className="px-4 py-3 text-left font-bold text-white/70">Équipe</th>
                        <th className="px-4 py-3 text-center font-bold text-white/70">Pts</th>
                        <th className="px-4 py-3 text-center font-bold text-white/70">J</th>
                        <th className="px-4 py-3 text-center font-bold text-white/70">V</th>
                        <th className="px-4 py-3 text-center font-bold text-white/70">N</th>
                        <th className="px-4 py-3 text-center font-bold text-white/70">D</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                      {classement.map((equipe, index) => {
                        const isTLSTT = equipe.numero === TLSTT_CLUB_NUMBER
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
                                    : 'bg-[#333] text-white/70'
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
                                <span className={isTLSTT ? 'text-[#3b9fd8]' : ''}>
                                  {equipe.equipe}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#3b9fd8]">
                              {equipe.pts}
                            </td>
                            <td className="px-4 py-3 text-center text-white/70">{equipe.joue}</td>
                            <td className="px-4 py-3 text-center text-green-500 font-semibold">
                              {equipe.vic}
                            </td>
                            <td className="px-4 py-3 text-center text-white/60">{equipe.nul}</td>
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
                <p className="text-white/50 text-center py-8">
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
                  <span className="text-white/70">Matchs joués</span>
                  <span className="font-bold text-[#3b9fd8]">{equipeJoue}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#333]">
                  <span className="text-white/70">Victoires</span>
                  <span className="font-bold text-green-500">{equipeVic}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#333]">
                  <span className="text-white/70">Nuls</span>
                  <span className="font-bold text-white/60">{equipeNul}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70">Défaites</span>
                  <span className="font-bold text-red-500">{equipeDef}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] border-l-4 border-l-[#3b9fd8] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#3b9fd8] mb-3">
                <i className="fas fa-info-circle mr-2"></i>
                Infos pratiques
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
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
                        <div className="text-sm text-white/50 mb-2">
                          <i className="fas fa-calendar mr-1"></i>
                          {match.libelle}
                          {match.dateprevue && ` - ${match.dateprevue}`}
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-semibold ${
                              isTLSTTa ? 'text-[#3b9fd8]' : 'text-white/80'
                            }`}
                          >
                            {match.equa}
                          </span>
                          <span className="text-white/40">vs</span>
                          <span
                            className={`font-semibold ${
                              !isTLSTTa ? 'text-[#3b9fd8]' : 'text-white/80'
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
                          <span className="text-white/40 mx-2">-</span>
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
                      <div className="text-xs text-white/40 mb-1">{match.libelle} - {match.dateprevue}</div>
                      <div className="text-sm">
                        <span className="text-white/80">{match.equa}</span>
                        <span className="text-white/40 mx-2">vs</span>
                        <span className="text-white/80">{match.equb}</span>
                      </div>
                    </div>
                    {hasScore ? (
                      <div className="font-bold">
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
      </div>
    </div>
  )
}
