import type { Metadata } from 'next'
import { SmartPingAPI } from '@/lib/smartping/api'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, generatePageMeta } from '@/lib/seo'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export const revalidate = 1800 // Revalider toutes les 30 minutes

const TLSTT_CLUB_NUMBER = '13830083'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('name, division')
    .eq('id', parseInt(id))
    .single()

  if (!team) {
    return { title: 'Équipe non trouvée' }
  }

  return generatePageMeta({
    title: `${team.name} - ${team.division || 'Championnat'}`,
    description: `Classement, résultats et statistiques de l'équipe ${team.name} du TLSTT en ${team.division || 'championnat FFTT'}. Données officielles en temps réel.`,
    path: `/equipes/${id}`,
    keywords: ['équipe', team.name, team.division || '', 'TLSTT', 'championnat', 'résultats', 'tennis de table'],
  })
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

    // 2. Récupérer D1 et cx_poule depuis le champ link_fftt (format: "D1=xxx&cx_poule=yyy")
    let D1 = ''
    let cx_poule = ''

    if (teamFromDb.link_fftt && teamFromDb.link_fftt.includes('D1=')) {
      const linkParams = new URLSearchParams(teamFromDb.link_fftt)
      D1 = linkParams.get('D1') || ''
      cx_poule = linkParams.get('cx_poule') || ''
    }

    if (!D1 || !cx_poule) {
      // Fallback: essayer de récupérer via xml_equipe.php
      try {
        const equipesXml = await api.getEquipes(TLSTT_CLUB_NUMBER)
        const equipesFFTT = parseEquipesXml(equipesXml)

        const teamNumber = teamName.replace(/TLSTT\s*/i, '').trim()
        const matchingEquipe = equipesFFTT.find((eq) => {
          const ffttNumber = eq.libequipe.replace(/.*?(\d+)\s*$/, '$1').trim()
          return ffttNumber === teamNumber
        })

        if (matchingEquipe) {
          const eqParams = new URLSearchParams(matchingEquipe.liendivision)
          D1 = eqParams.get('D1') || ''
          cx_poule = eqParams.get('cx_poule') || ''
          teamDivision = matchingEquipe.libdivision || teamDivision
        }
      } catch {
        // xml_equipe.php may return 401, continue with what we have
      }
    }

    if (D1 && cx_poule) {
      // 3. Récupérer le classement de la poule
      try {
        const classementXml = await api.getClassementPoule(D1, cx_poule)
        classement = parseClassementXml(classementXml)
      } catch (e: any) {
        console.error('Erreur classement:', e.message)
      }

      // 4. Récupérer les rencontres (résultats)
      try {
        const rencontresXml = await api.getResultatsPoule(D1, cx_poule)
        rencontres = parseRencontresXml(rencontresXml)
      } catch (e: any) {
        console.error('Erreur rencontres:', e.message)
      }
    } else {
      error = `Données de poule non disponibles pour ${teamName}. Lancez la découverte via /api/discover-equipes pour synchroniser les paramètres FFTT.`
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Équipes', url: '/equipes' },
        { name: teamName, url: `/equipes/${id}` },
      ])} />

      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <Link
                href="/equipes"
                className="text-[#3b9fd8] hover:text-[#2d8bc9] mb-4 inline-flex items-center gap-2 transition-colors text-sm"
              >
                <i className="fas fa-arrow-left"></i>
                Retour aux équipes
              </Link>
              <div className="flex items-center gap-4 mt-3">
                <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-users text-2xl text-white"></i>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{teamName}</h1>
                  <p className="text-gray-400 text-lg">
                    {teamDivision}
                    {teamPool && ` - Poule ${teamPool}`}
                  </p>
                </div>
              </div>
            </div>
            {equipeInfo && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-[#3b9fd8]">{equipePosition}</div>
                  <div className="text-sm text-gray-500">Classement</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-white">{equipePoints}</div>
                  <div className="text-sm text-gray-500">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-green-500">{equipeVic}</div>
                  <div className="text-sm text-gray-500">Victoires</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
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
      </div>
    </div>
  )
}
