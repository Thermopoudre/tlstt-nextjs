import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, generatePageMeta } from '@/lib/seo'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EquipeTabsClient from './EquipeTabsClient'

export const revalidate = 1800 // Revalider toutes les 30 minutes

const LIGUE_URL = 'https://www.tennisdetableregionsud.fr/index.php/competitions/equipes/:championnat_reg:'

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

/**
 * Extrait le contenu HTML d'une div identifiée par son id.
 * Gère correctement le nesting en comptant les balises <div> ouvrantes/fermantes.
 */
function extractDivContent(html: string, divId: string): string {
  const marker = `id="${divId}"`
  const startIdx = html.indexOf(marker)
  if (startIdx === -1) return ''

  const tagEnd = html.indexOf('>', startIdx)
  if (tagEnd === -1) return ''

  const contentStart = tagEnd + 1
  let depth = 1
  let pos = contentStart

  while (pos < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', pos)
    const nextClose = html.indexOf('</div>', pos)

    if (nextClose === -1) break

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++
      pos = nextOpen + 4
    } else {
      depth--
      if (depth === 0) {
        return html.substring(contentStart, nextClose)
      }
      pos = nextClose + 6
    }
  }

  return html.substring(contentStart, pos)
}

function parseCellText(cell: string): string {
  return cell.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
}

function parseClassementHtml(divContent: string): { classement: ClassementEntry[]; divisionName: string } {
  const classement: ClassementEntry[] = []
  let divisionName = ''

  // Table CSS class "class_cheq" = tableau de classement
  const tableMatch = divContent.match(/<table[^>]*class="[^"]*class_cheq[^"]*"[^>]*>([\s\S]*?)<\/table>/)
  if (!tableMatch) return { classement, divisionName }

  const tableContent = tableMatch[1]

  // Extraire le nom de la division depuis la légende
  const captionMatch = tableContent.match(/<caption[^>]*>([\s\S]*?)<\/caption>/)
  if (captionMatch) {
    divisionName = parseCellText(captionMatch[1])
  }

  // Colonnes : #, Equipe, Joué, Pts, V, N, D, FF/P, PG, PP
  const rowMatches = tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)
  for (const rowMatch of rowMatches) {
    const rowContent = rowMatch[1]
    if (rowContent.includes('<th')) continue // Ignorer les en-têtes

    const cells: string[] = []
    const cellMatches = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)
    for (const cellMatch of cellMatches) {
      cells.push(parseCellText(cellMatch[1]))
    }

    if (cells.length >= 4) {
      classement.push({
        clt: cells[0] || '',
        equipe: cells[1] || '',
        joue: cells[2] || '',
        pts: cells[3] || '',
        vic: cells[4] || '',
        nul: cells[5] || '',
        def: cells[6] || '',
        pf: cells[7] || '',
        pg: cells[8] || '',
        pp: cells[9] || '',
        numero: '', // Le site ligue ne fournit pas le numéro de club
      })
    }
  }

  return { classement, divisionName }
}

function parseRencontresHtml(divContent: string): Rencontre[] {
  const rencontres: Rencontre[] = []

  // Chaque journée = une table CSS "journee_cheq"
  const tableMatches = divContent.matchAll(/<table[^>]*class="[^"]*journee_cheq[^"]*"[^>]*>([\s\S]*?)<\/table>/g)

  for (const tableMatch of tableMatches) {
    const tableContent = tableMatch[1]

    // Caption : "tour n°1 du 20/09/2025"
    const captionMatch = tableContent.match(/<caption[^>]*>([\s\S]*?)<\/caption>/)
    let libelle = ''
    let dateprevue = ''
    if (captionMatch) {
      const captionText = parseCellText(captionMatch[1])
      const tourMatch = captionText.match(/^(.*?)\s+du\s+(\d{2}\/\d{2}\/\d{4})/)
      if (tourMatch) {
        libelle = tourMatch[1].trim()
        dateprevue = tourMatch[2]
      } else {
        libelle = captionText
      }
    }

    // Lignes de match : equa | "scoreA - scoreB" | equb
    const rowMatches = tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)
    for (const rowMatch of rowMatches) {
      const rowContent = rowMatch[1]
      if (rowContent.includes('<th')) continue

      const cells: string[] = []
      const cellMatches = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)
      for (const cellMatch of cellMatches) {
        cells.push(parseCellText(cellMatch[1]))
      }

      if (cells.length >= 3) {
        const scoreStr = cells[1] || ''
        const scoreMatch = scoreStr.match(/^(\d+)\s*-\s*(\d+)$/)
        const scorea = scoreMatch ? scoreMatch[1] : ''
        const scoreb = scoreMatch ? scoreMatch[2] : ''

        rencontres.push({
          libelle,
          equa: cells[0] || '',
          equb: cells[2] || '',
          scorea,
          scoreb,
          dateprevue,
          datereelle: scorea ? dateprevue : '',
          lien: '',
        })
      }
    }
  }

  return rencontres
}

/**
 * Scrape la page du site de la ligue pour récupérer classement + rencontres
 * d'une poule identifiée par son id SPIP (ex: "R2_2_p1", "PN_p1").
 */
async function fetchFromLigueSite(spipId: string): Promise<{
  classement: ClassementEntry[]
  rencontres: Rencontre[]
  divisionName: string
  error: string | null
}> {
  try {
    const response = await fetch(LIGUE_URL, {
      next: { revalidate: 3600 }, // Cache Next.js : 1 heure
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TLSTT-Site/1.0)' },
    })

    if (!response.ok) {
      return {
        classement: [], rencontres: [], divisionName: '',
        error: `Site ligue inaccessible (HTTP ${response.status})`,
      }
    }

    const html = await response.text()
    const divContent = extractDivContent(html, spipId)

    if (!divContent) {
      return {
        classement: [], rencontres: [], divisionName: '',
        error: `Poule "${spipId}" non trouvée sur le site de la ligue`,
      }
    }

    const { classement, divisionName } = parseClassementHtml(divContent)
    const rencontres = parseRencontresHtml(divContent)

    return {
      classement,
      rencontres,
      divisionName,
      error: classement.length === 0 ? 'Classement introuvable dans les données de la ligue' : null,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return { classement: [], rencontres: [], divisionName: '', error: `Erreur scraper: ${msg}` }
  }
}

export default async function EquipeDetailPage({ params }: PageProps) {
  const { id } = await params

  let teamName = ''
  let teamDivision = ''
  let teamPool = ''

  let phase1Data = { classement: [] as ClassementEntry[], rencontres: [] as Rencontre[], error: null as string | null }
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
    const linkFftt: string = teamFromDb.link_fftt || ''
    if (linkFftt.startsWith('SPIP:')) {
      const spipId = linkFftt.replace(/^SPIP:/, '')
      // Les poules Nationales (N1, N2, N3, PN...) sont gérées au niveau fédéral,
      // pas sur le site régional — on évite un appel inutile au scraper.
      if (/^(N[1-9]|PN)/i.test(spipId)) {
        phase1Data.error = `NATIONALE:${teamDivision || spipId}`
      } else {
        const result = await fetchFromLigueSite(spipId)
        phase1Data = { classement: result.classement, rencontres: result.rencontres, error: result.error }
        if (result.divisionName && !teamDivision) {
          teamDivision = result.divisionName
        }
      }
    } else {
      phase1Data.error = `Données non disponibles pour ${teamName}. Configurez le lien FFTT au format "SPIP:ID_POULE" (ex: SPIP:R2_2_p1) dans l'administration.`
    }

    // --- Phase 2 ---
    const linkFfttP2: string = teamFromDb.link_fftt_phase2 || ''
    if (linkFfttP2.startsWith('SPIP:')) {
      hasPhase2 = true
      const spipId2 = linkFfttP2.replace(/^SPIP:/, '')
      const result2 = await fetchFromLigueSite(spipId2)
      phase2Data = { classement: result2.classement, rencontres: result2.rencontres, error: result2.error }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    phase1Data.error = msg
    console.error('Erreur page équipe:', e)
  }

  // Fallback Supabase si le scraper a échoué et que des données locales existent
  if (phase1Data.error && phase1Data.classement.length === 0) {
    const supabaseFallback = await createClient()
    const { data: teamFallback } = await supabaseFallback
      .from('teams')
      .select('name, cla, pts, vic, def, nul, joue')
      .eq('id', parseInt(id))
      .single()

    if (teamFallback && teamFallback.cla) {
      const fallbackEntry: ClassementEntry = {
        clt: String(teamFallback.cla),
        equipe: teamFallback.name || teamName,
        pts: String(teamFallback.pts || 0),
        vic: String(teamFallback.vic || 0),
        def: String(teamFallback.def || 0),
        nul: String(teamFallback.nul || 0),
        joue: String(teamFallback.joue || 0),
        pf: '', pg: '', pp: '', numero: '',
      }
      phase1Data = {
        classement: [fallbackEntry],
        rencontres: [],
        error: 'Site ligue temporairement inaccessible — données du dernier sync affichées',
      }
    }
  }

  // Stats Hero (Phase 1 par défaut) — détection par nom car le site ligue n'a pas de numéro de club
  const equipeInfo = phase1Data.classement.find((e) => {
    const nom = e.equipe.toUpperCase()
    return nom.includes('TLSTT') || nom.includes('SEYNE') || nom.includes('TOULON LA SEYNE')
  }) || null

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
          TLSTT_CLUB_NUMBER=""
        />
      </div>
    </div>
  )
}
