import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// CONFIG TLSTT - Saison 2025/2026
// ============================================
const CLUB_NAME_FFTT = 'TOULON LA SEYNE'
const REGIONAL_URL = 'https://www.tennisdetableregionsud.fr/index.php/competitions/equipes/:championnat_reg:'
const NATIONAL_URL = 'https://www.tennisdetableregionsud.fr/index.php/competitions/equipes/:championnat_nat:'

// Mapping TLSTT → nom FFTT officiel et division Phase 1
const TLSTT_TEAMS = [
  { name: 'TLSTT 1', ffttName: 'TOULON LA SEYNE 1', source: 'national', division: 'Nationale 3', phaseDiv: 'N3' },
  { name: 'TLSTT 2', ffttName: 'TOULON LA SEYNE 2', source: 'regional', division: 'Regionale 2', phaseDiv: 'R2' },
  { name: 'TLSTT 3', ffttName: 'TOULON LA SEYNE 3', source: 'regional', division: 'Regionale 2', phaseDiv: 'R2' },
  { name: 'TLSTT 4', ffttName: 'TOULON LA SEYNE 4', source: 'regional', division: 'Regionale 3', phaseDiv: 'R3' },
  { name: 'TLSTT 5', ffttName: 'TOULON LA SEYNE 5', source: 'departmental', division: 'Pre-Regionale', phaseDiv: 'PR' },
  { name: 'TLSTT 6', ffttName: 'TOULON LA SEYNE 6', source: 'departmental', division: 'Departementale 1', phaseDiv: 'D1' },
  { name: 'TLSTT 7', ffttName: 'TOULON LA SEYNE 7', source: 'departmental', division: 'Departementale 1', phaseDiv: 'D1' },
  { name: 'TLSTT 8', ffttName: 'TOULON LA SEYNE 8', source: 'departmental', division: 'Departementale 2', phaseDiv: 'D2' },
  { name: 'TLSTT 9', ffttName: 'TOULON LA SEYNE 9', source: 'departmental', division: 'Departementale 3', phaseDiv: 'D3' },
  { name: 'TLSTT 10', ffttName: 'TOULON LA SEYNE 10', source: 'departmental', division: 'Departementale 3', phaseDiv: 'D3' },
  { name: 'TLSTT 11', ffttName: 'TOULON LA SEYNE 11', source: 'departmental', division: 'Departementale 3', phaseDiv: 'D3' },
  { name: 'TLSTT 12', ffttName: 'TOULON LA SEYNE 12', source: 'departmental', division: 'Departementale 4 Jeunes', phaseDiv: 'D4' },
  { name: 'TLSTT 13', ffttName: 'TOULON LA SEYNE 13', source: 'departmental', division: 'Departementale 4 Jeunes', phaseDiv: 'D4' },
]

interface TeamStats {
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  pool?: string
  division?: string
}

interface MatchResult {
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  teamName: string   // TLSTT X
  opponent: string
  location: string
  type: 'domicile' | 'exterieur'
  division: string
  scoreFor: number | null
  scoreAgainst: number | null
  status: 'completed' | 'upcoming'
}

// ============================================
// MAIN SYNC HANDLER
// ============================================
export async function GET() {
  const supabase = await createClient()
  const results: { team: string; status: string; stats?: TeamStats; error?: string }[] = []
  const allMatches: MatchResult[] = []
  const errors: string[] = []

  try {
    // ============================================
    // 1. SCRAPER LE SITE REGIONAL (PN, R1, R2, R3)
    // ============================================
    const regionalData = await fetchAndParseSiteData(REGIONAL_URL, 'regional', errors)

    // ============================================
    // 2. SCRAPER LE SITE NATIONAL (N1, N2, N3)
    // ============================================
    const nationalData = await fetchAndParseSiteData(NATIONAL_URL, 'national', errors)

    // Combiner les données
    const allData = new Map<string, { stats: TeamStats; matches: ParsedMatch[] }>()
    for (const [key, val] of regionalData) allData.set(key, val)
    for (const [key, val] of nationalData) allData.set(key, val)

    // ============================================
    // 3. METTRE A JOUR SUPABASE - teams
    // ============================================
    for (const config of TLSTT_TEAMS) {
      const data = allData.get(config.ffttName)

      if (data && data.stats.joue > 0) {
        const { error } = await supabase
          .from('teams')
          .update({
            cla: data.stats.cla,
            joue: data.stats.joue,
            pts: data.stats.pts,
            vic: data.stats.vic,
            def: data.stats.def,
            nul: data.stats.nul,
            division: data.stats.division || config.division,
            pool: data.stats.pool || undefined,
            link_fftt: `Phase 1 Final: ${config.division} - ${data.stats.cla}e (${data.stats.vic}V ${data.stats.nul}N ${data.stats.def}D)`,
            updated_at: new Date().toISOString(),
          })
          .ilike('name', config.name)

        if (error) {
          results.push({ team: config.name, status: 'error', error: error.message })
        } else {
          results.push({ team: config.name, status: 'updated', stats: data.stats })
        }

        // Collecter les matchs
        if (data.matches.length > 0) {
          for (const match of data.matches) {
            const isTLSTT_A = match.teamA.toUpperCase().includes('TOULON') || match.teamA.toUpperCase().includes('SEYNE')
            allMatches.push({
              date: parseFrenchDate(match.date),
              time: '14:00',
              teamName: config.name,
              opponent: isTLSTT_A ? match.teamB : match.teamA,
              location: isTLSTT_A ? 'Gymnase Léo Lagrange' : 'Extérieur',
              type: isTLSTT_A ? 'domicile' : 'exterieur',
              division: config.division,
              scoreFor: isTLSTT_A ? match.scoreA : match.scoreB,
              scoreAgainst: isTLSTT_A ? match.scoreB : match.scoreA,
              status: (match.scoreA !== null && match.scoreB !== null) ? 'completed' : 'upcoming',
            })
          }
        }
      } else {
        results.push({ team: config.name, status: 'no_data', error: `Pas de données trouvées pour ${config.ffttName}` })
      }
    }

    // ============================================
    // 4. METTRE A JOUR competitions (si des matchs trouvés)
    // ============================================
    let matchesInserted = 0
    if (allMatches.length > 0) {
      // Supprimer les anciennes compétitions auto-sync pour éviter les doublons
      // On ne supprime que les matchs qui seront re-insérés
      for (const match of allMatches) {
        if (match.scoreFor !== null) {
          // Upsert: chercher si le match existe déjà (même date, même équipe, même adversaire)
          const { data: existing } = await supabase
            .from('competitions')
            .select('id')
            .eq('date', match.date)
            .eq('team_name', match.teamName)
            .eq('opponent', match.opponent)
            .limit(1)

          if (existing && existing.length > 0) {
            // Update
            await supabase
              .from('competitions')
              .update({
                score_for: match.scoreFor,
                score_against: match.scoreAgainst,
                result: `${match.scoreFor}-${match.scoreAgainst}`,
                status: match.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing[0].id)
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('competitions')
              .insert({
                date: match.date,
                time: match.time,
                team_name: match.teamName,
                opponent: match.opponent,
                location: match.location,
                type: match.type,
                division: match.division,
                score_for: match.scoreFor,
                score_against: match.scoreAgainst,
                result: match.scoreFor !== null ? `${match.scoreFor}-${match.scoreAgainst}` : null,
                status: match.status,
              })
            if (!insertError) matchesInserted++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'Scraping tennisdetableregionsud.fr (régional + national)',
      summary: {
        total: TLSTT_TEAMS.length,
        updated: results.filter(r => r.status === 'updated').length,
        noData: results.filter(r => r.status === 'no_data').length,
        errors: results.filter(r => r.status === 'error').length,
        matchesFound: allMatches.length,
        matchesInserted,
      },
      results,
      fetchErrors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur sync-equipes:', message)
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    })
  }
}

// ============================================
// PARSING: Extraire données depuis le HTML
// ============================================

interface ParsedMatch {
  tour: string
  date: string
  teamA: string
  teamB: string
  scoreA: number | null
  scoreB: number | null
}

async function fetchAndParseSiteData(
  url: string,
  source: string,
  errors: string[]
): Promise<Map<string, { stats: TeamStats; matches: ParsedMatch[] }>> {
  const result = new Map<string, { stats: TeamStats; matches: ParsedMatch[] }>()

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (TLSTT-Site-Sync/2.0)',
      }
    })
    if (!response.ok) {
      errors.push(`${source}: HTTP ${response.status}`)
      return result
    }
    const html = await response.text()

    // Chercher toutes les sections de classement qui contiennent TOULON LA SEYNE
    // Le site affiche les classements en tableaux avec des titres de division
    
    // Pattern 1: Chercher dans les tableaux de classement (format texte du site)
    // Structure: "Division - Phase X" suivi de "#|Equipe|Joué|Pts|V|N|D|FF/P|PG|PP"
    
    // On cherche toutes les occurrences de TOULON LA SEYNE dans le HTML
    const searchPattern = /TOULON\s+LA\s+SEYNE\s*(\d+)?/gi
    let match
    
    while ((match = searchPattern.exec(html)) !== null) {
      const num = match[1] || '1'
      const teamName = `TOULON LA SEYNE ${num}`
      
      // Déjà trouvé ? On ne remplace pas
      if (result.has(teamName)) continue
      
      // Prendre un large chunk autour de cette occurrence
      const contextStart = Math.max(0, match.index - 5000)
      const contextEnd = Math.min(html.length, match.index + 2000)
      const chunk = html.substring(contextStart, contextEnd)
      
      // Extraire les stats depuis le classement
      const stats = extractStatsFromContext(chunk, teamName)
      
      // Extraire les matchs depuis le contexte plus large
      const matches = extractMatchesFromContext(html, match.index, teamName)
      
      if (stats && stats.joue > 0) {
        result.set(teamName, { stats, matches })
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    errors.push(`${source} fetch: ${msg}`)
  }

  return result
}

function extractStatsFromContext(chunk: string, teamName: string): TeamStats | null {
  // Le site affiche les classements sous forme de texte dans le HTML:
  // "#|Equipe|Joué|Pts|V|N|D|FF/P|PG|PP"
  // "5|TOULON LA SEYNE 1|7|13|2|2|3|0|44|44"
  
  const teamNum = teamName.match(/\d+$/)?.[0] || '1'
  
  // Pattern pour trouver la ligne de classement de cette équipe
  // Format: rang | TOULON LA SEYNE X | joué | pts | vic | nul | def | ff | pg | pp
  const patterns = [
    // Format tableau HTML: <td>rang</td><td>nom</td><td>joué</td>...
    new RegExp(
      `(\\d+)\\s*\\|\\s*TOULON\\s+LA\\s+SEYNE\\s*${teamNum}\\s*\\|\\s*(\\d+)\\s*\\|\\s*(\\d+)\\s*\\|\\s*(\\d+)\\s*\\|\\s*(\\d+)\\s*\\|\\s*(\\d+)`,
      'i'
    ),
    // Format texte brut du site après conversion markdown
    new RegExp(
      `(\\d+)\\s*[|]\\s*TOULON\\s+LA\\s+SEYNE\\s*${teamNum}\\s*[|]\\s*(\\d+)\\s*[|]\\s*(\\d+)\\s*[|]\\s*(\\d+)\\s*[|]\\s*(\\d+)\\s*[|]\\s*(\\d+)`,
      'i'
    ),
  ]
  
  for (const pattern of patterns) {
    const m = chunk.match(pattern)
    if (m) {
      return {
        cla: parseInt(m[1]) || 0,
        joue: parseInt(m[2]) || 0,
        pts: parseInt(m[3]) || 0,
        vic: parseInt(m[4]) || 0,
        nul: parseInt(m[5]) || 0,
        def: parseInt(m[6]) || 0,
      }
    }
  }
  
  // Fallback: chercher dans des tags HTML <td>
  const tdPattern = new RegExp(
    `<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>[^<]*TOULON\\s*LA\\s*SEYNE\\s*${teamNum}[^<]*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>`,
    'i'
  )
  const tdMatch = chunk.match(tdPattern)
  if (tdMatch) {
    return {
      cla: parseInt(tdMatch[1]) || 0,
      joue: parseInt(tdMatch[2]) || 0,
      pts: parseInt(tdMatch[3]) || 0,
      vic: parseInt(tdMatch[4]) || 0,
      nul: parseInt(tdMatch[5]) || 0,
      def: parseInt(tdMatch[6]) || 0,
    }
  }
  
  return null
}

function extractMatchesFromContext(
  html: string,
  teamIndex: number,
  teamName: string
): ParsedMatch[] {
  const matches: ParsedMatch[] = []
  const teamNum = teamName.match(/\d+$/)?.[0] || '1'
  
  // Chercher les lignes de résultats de matchs
  // Format: "tour n°X du DD/MM/YYYY" suivi de "EQUIPE_A|score_a - score_b|EQUIPE_B"
  // On cherche dans un large contexte autour de l'équipe
  const start = Math.max(0, teamIndex - 15000)
  const end = Math.min(html.length, teamIndex + 15000)
  const chunk = html.substring(start, end)
  
  // Pattern pour les tours avec dates
  const tourPattern = /tour\s+n[°o]\s*(\d+)\s+du\s+(\d{2}\/\d{2}\/\d{4})/gi
  let tourMatch
  const tours: { num: string; date: string; idx: number }[] = []
  
  while ((tourMatch = tourPattern.exec(chunk)) !== null) {
    tours.push({ num: tourMatch[1], date: tourMatch[2], idx: tourMatch.index })
  }
  
  // Pour chaque tour, chercher les matchs TLSTT
  for (let i = 0; i < tours.length; i++) {
    const tourStart = tours[i].idx
    const tourEnd = i < tours.length - 1 ? tours[i + 1].idx : tourStart + 2000
    const tourChunk = chunk.substring(tourStart, tourEnd)
    
    // Pattern: "EQUIPE_A|score - score|EQUIPE_B" OU "EQUIPE_A score - score EQUIPE_B"
    const matchPattern = new RegExp(
      `([^|\\n]+TOULON\\s*LA\\s*SEYNE\\s*${teamNum}[^|\\n]*)\\s*[|]?\\s*(\\d+)\\s*-\\s*(\\d+)\\s*[|]?\\s*([^|\\n]+?)\\s*[|\\n]`,
      'i'
    )
    const matchPatternReverse = new RegExp(
      `([^|\\n]+?)\\s*[|]?\\s*(\\d+)\\s*-\\s*(\\d+)\\s*[|]?\\s*([^|\\n]*TOULON\\s*LA\\s*SEYNE\\s*${teamNum}[^|\\n]*)`,
      'i'
    )
    
    let m = tourChunk.match(matchPattern)
    if (m) {
      matches.push({
        tour: `Tour ${tours[i].num}`,
        date: tours[i].date,
        teamA: m[1].trim(),
        teamB: m[4].trim(),
        scoreA: parseInt(m[2]),
        scoreB: parseInt(m[3]),
      })
    } else {
      m = tourChunk.match(matchPatternReverse)
      if (m) {
        matches.push({
          tour: `Tour ${tours[i].num}`,
          date: tours[i].date,
          teamA: m[1].trim(),
          teamB: m[4].trim(),
          scoreA: parseInt(m[2]),
          scoreB: parseInt(m[3]),
        })
      }
    }
  }
  
  return matches
}

function parseFrenchDate(dateStr: string): string {
  if (!dateStr) return '9999-12-31'
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return dateStr
}
