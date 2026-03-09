import type { Metadata } from 'next'
import { SmartPingAPI } from '@/lib/smartping/api'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, generatePageMeta } from '@/lib/seo'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EquipeTabsClient from './EquipeTabsClient'

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

/** Récupère classement + rencontres pour un couple (D1, cx_poule) */
async function fetchPhaseData(
  api: SmartPingAPI,
  D1: string,
  cx_poule: string
): Promise<{ classement: ClassementEntry[]; rencontres: Rencontre[]; error: string | null }> {
  let classement: ClassementEntry[] = []
  let rencontres: Rencontre[] = []
  let error: string | null = null

  try {
    const classementXml = await api.getClassementPoule(D1, cx_poule)
    classement = parseClassementXml(classementXml)
  } catch (e: any) {
    console.error('Erreur classement:', e.message)
    error = e.message
  }

  try {
    const rencontresXml = await api.getResultatsPoule(D1, cx_poule)
    rencontres = parseRencontresXml(rencontresXml)
  } catch (e: any) {
    console.error('Erreur rencontres:', e.message)
    if (!error) error = e.message
  }

  return { classement, rencontres, error }
}

export default async function EquipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const api = new SmartPingAPI()

  let teamName = ''
  let teamDivision = ''
  let teamPool = ''

  // Données Phase 1
  let phase1Data = { classement: [] as ClassementEntry[], rencontres: [] as Rencontre[], error: null as string | null }
  // Données Phase 2 (null si pas de link_fftt_phase2)
  let phase2Data = { classement: [] as ClassementEntry[], rencontres: [] as Rencontre[], error: null as string | null }
  let hasPhase2 = false

  try {
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

    // --- Phase 1 ---
    let D1 = ''
    let cx_poule = ''

    if (teamFromDb.link_fftt && teamFromDb.link_fftt.includes('D1=')) {
      const linkParams = new URLSearchParams(teamFromDb.link_fftt)
      D1 = linkParams.get('D1') || ''
      cx_poule = linkParams.get('cx_poule') || ''
    }

    if (!D1 || !cx_poule) {
      // Fallback via xml_equipe.php
      try {
        const equipesXml = await api.getEquipes(TLSTT_CLUB_NUMBER)
        const equipesFFTT = parseEquipesXml(equipesXml)
        const teamNumber = teamName.replace(/TLSTT\s*/i, '').trim()
        const matchingEquipe = equipesFFTT.find((eq) => {
          const ffttNumber = eq.libequipe.replace(/.*?(\d+)\s*$/, '$1').trim()
          return parseInt(ffttNumber, 10) === parseInt(teamNumber, 10)
        })
        if (matchingEquipe) {
          const eqParams = new URLSearchParams(matchingEquipe.liendivision)
          D1 = eqParams.get('D1') || ''
          cx_poule = eqParams.get('cx_poule') || ''
          teamDivision = matchingEquipe.libdivision || teamDivision
        }
      } catch {
        // xml_equipe.php can return 401, ignore
      }
    }

    if (D1 && cx_poule) {
      phase1Data = await fetchPhaseData(api, D1, cx_poule)
    } else {
      phase1Data.error = `Données de poule non disponibles pour ${teamName}. Lancez la découverte via /api/discover-equipes pour synchroniser les paramètres FFTT.`
    }

    // --- Phase 2 ---
    if (teamFromDb.link_fftt_phase2 && teamFromDb.link_fftt_phase2.includes('D1=')) {
      hasPhase2 = true
      const p2Params = new URLSearchParams(teamFromDb.link_fftt_phase2)
      const D1p2 = p2Params.get('D1') || ''
      const cx_pouléP2 = p2Params.get('cx_poule') || ''
      if (D1p2 && cx_pouléP2) {
        phase2Data = await fetchPhaseData(api, D1p2, cx_pouléP2)
      } else {
        phase2Data.error = 'Paramètres Phase 2 invalides (D1 ou cx_poule manquant).'
      }
    }
  } catch (e: any) {
    phase1Data.error = e.message
    console.error('Erreur API équipe:', e)
  }

  // Stats Hero (Phase 1 par défaut)
  const equipeInfo = phase1Data.classement.find((e) => e.numero === TLSTT_CLUB_NUMBER) || null

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
                  <div className="text-4xl font-bold mb-1 text-[#3b9fd8]">{equipeInfo.clt}</div>
                  <div className="text-sm text-gray-500">Classement</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-white">{equipeInfo.pts}</div>
                  <div className="text-sm text-gray-500">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-green-500">{equipeInfo.vic}</div>
                  <div className="text-sm text-gray-500">Victoires</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <EquipeTabsClient
          hasPhase2={hasPhase2}
          phase1={phase1Data}
          phase2={phase2Data}
          teamName={teamName}
          TLSTT_CLUB_NUMBER={TLSTT_CLUB_NUMBER}
        />
      </div>
    </div>
  )
}
