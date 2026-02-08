import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// CONFIG PHASE 2 - Saison 2025/2026
// Source: PDF officiel ligue PACA 2526_equipes_paca_ph2.pdf
// ============================================

const REGIONAL_URL = 'https://www.tennisdetableregionsud.fr/index.php/competitions/equipes/:championnat_reg:'

// Mapping equipes TLSTT -> divisions Phase 2
const TLSTT_PHASE2_CONFIG = [
  { name: 'TLSTT 1', searchName: 'TOULON LA SEYNE 1', source: 'national', division: 'Nationale 3', pool: '7' },
  { name: 'TLSTT 2', searchName: 'TOULON LA SEYNE 2', source: 'regional', division: 'Regionale 1', pool: '2' },
  { name: 'TLSTT 3', searchName: 'TOULON LA SEYNE 3', source: 'regional', division: 'Regionale 3', pool: '2' },
  { name: 'TLSTT 4', searchName: 'TOULON LA SEYNE 4', source: 'regional', division: 'Regionale 3', pool: '6' },
  { name: 'TLSTT 5', searchName: 'TOULON LA SEYNE 5', source: 'departmental', division: 'Pre-Regionale', pool: '2' },
  { name: 'TLSTT 6', searchName: 'TOULON LA SEYNE 6', source: 'departmental', division: 'Departementale 1', pool: '1' },
  { name: 'TLSTT 7', searchName: 'TOULON LA SEYNE 7', source: 'departmental', division: 'Departementale 1', pool: '2' },
  { name: 'TLSTT 8', searchName: 'TOULON LA SEYNE 8', source: 'departmental', division: 'Departementale 2', pool: '1' },
  { name: 'TLSTT 9', searchName: 'TOULON LA SEYNE 9', source: 'departmental', division: 'Departementale 3', pool: '4' },
  { name: 'TLSTT 10', searchName: 'TOULON LA SEYNE 10', source: 'departmental', division: 'Departementale 3', pool: '6' },
  { name: 'TLSTT 11', searchName: 'TOULON LA SEYNE 11', source: 'departmental', division: 'Departementale 3', pool: '1' },
  { name: 'TLSTT 12', searchName: 'TOULON LA SEYNE 12', source: 'departmental', division: 'Departementale 4 Jeunes', pool: '1' },
  { name: 'TLSTT 13', searchName: 'TOULON LA SEYNE 13', source: 'departmental', division: 'Departementale 4 Jeunes', pool: '1' },
]

interface TeamStats {
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
}

export async function GET() {
  const supabase = await createClient()
  const results: { team: string; status: string; stats?: TeamStats; error?: string }[] = []
  const errors: string[] = []

  try {
    // ============================================
    // 1. SCRAPER LE SITE REGIONAL (PN, R1, R2, R3)
    // ============================================
    let regionalHtml = ''
    try {
      const response = await fetch(REGIONAL_URL, {
        cache: 'no-store',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (TLSTT Site)',
        }
      })
      if (response.ok) {
        regionalHtml = await response.text()
      } else {
        errors.push(`Regional site: HTTP ${response.status}`)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      errors.push(`Regional fetch: ${msg}`)
    }

    // ============================================
    // 2. CHERCHER LES RESULTATS PHASE 2
    // ============================================
    const phase2Stats = new Map<string, TeamStats>()

    if (regionalHtml) {
      // Chercher les sections Phase 2 dans le HTML
      // Le site regional affiche les classements sous forme de tableaux
      // Pattern: "Division - Phase 2" suivi d'un tableau classement
      
      const divisionPatterns = [
        { pattern: /Pr[eÃ©]-Nationale\s+Messieurs\s*-\s*Phase\s*2/gi, division: 'PN', pool: '' },
        { pattern: /R[eÃ©]gionale\s+1\s+Messieurs\s+poule\s+(\d+)\s*-\s*Phase\s*2/gi, division: 'R1' },
        { pattern: /R[eÃ©]gionale\s+2\s+Messieurs\s+poule\s+(\d+)\s*-\s*Phase\s*2/gi, division: 'R2' },
        { pattern: /R[eÃ©]gionale\s+3\s+Messieurs\s+poule\s+(\d+)\s*-\s*Phase\s*2/gi, division: 'R3' },
      ]

      for (const dp of divisionPatterns) {
        let match
        const regex = new RegExp(dp.pattern.source, dp.pattern.flags)
        while ((match = regex.exec(regionalHtml)) !== null) {
          const pool = match[1] || dp.pool || ''
          const startIdx = match.index
          // Prendre 5000 chars apres le titre pour le classement
          const chunk = regionalHtml.substring(startIdx, startIdx + 5000)
          
          // Chercher TOULON LA SEYNE dans ce chunk
          const tlsttMatch = chunk.match(/TOULON\s+LA\s+SEYNE\s*(\d*)/i)
          if (tlsttMatch) {
            const num = tlsttMatch[1] || '1'
            const teamName = `TLSTT ${num}`
            
            // Extraire les stats depuis les cellules du tableau
            const stats = extractStatsFromChunk(chunk, tlsttMatch.index || 0)
            if (stats) {
              phase2Stats.set(teamName, stats)
            }
          }
        }
      }
    }

    // ============================================
    // 3. METTRE A JOUR SUPABASE
    // ============================================
    for (const config of TLSTT_PHASE2_CONFIG) {
      const stats = phase2Stats.get(config.name)

      if (stats && stats.joue > 0) {
        // On a des resultats Phase 2 scrapes
        const { error } = await supabase
          .from('teams')
          .update({
            division: config.division,
            pool: config.pool,
            phase: 2,
            cla: stats.cla,
            joue: stats.joue,
            pts: stats.pts,
            vic: stats.vic,
            def: stats.def,
            nul: stats.nul,
            link_fftt: `Phase 2 - ${config.division} Poule ${config.pool} - ${stats.cla}e`,
          })
          .ilike('name', config.name)

        if (error) {
          results.push({ team: config.name, status: 'error', error: error.message })
        } else {
          results.push({ team: config.name, status: 'updated', stats })
        }
      } else {
        // Pas de resultats Phase 2 encore - on met juste a jour la division
        const { error } = await supabase
          .from('teams')
          .update({
            division: config.division,
            pool: config.pool,
            phase: 2,
          })
          .ilike('name', config.name)

        if (error) {
          results.push({ team: config.name, status: 'error', error: error.message })
        } else {
          results.push({ team: config.name, status: 'division_only' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'Scraping tennisdetableregionsud.fr',
      summary: {
        total: TLSTT_PHASE2_CONFIG.length,
        updated: results.filter(r => r.status === 'updated').length,
        divisionOnly: results.filter(r => r.status === 'division_only').length,
        errors: results.filter(r => r.status === 'error').length,
        phase2DataFound: phase2Stats.size > 0,
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
// PARSER: Extraire stats depuis un chunk HTML
// ============================================
function extractStatsFromChunk(html: string, tlsttIdx: number): TeamStats | null {
  // Prendre le contexte autour de TOULON LA SEYNE
  const start = Math.max(0, tlsttIdx - 300)
  const end = Math.min(html.length, tlsttIdx + 500)
  const context = html.substring(start, end)

  // Chercher la ligne du tableau avec les stats
  // Pattern HTML typique: <td>rang</td><td>NOM</td><td>joue</td><td>pts</td><td>v</td><td>n</td><td>d</td>
  
  // Trouver toutes les cellules <td> dans le contexte
  const cells = context.match(/<td[^>]*>([^<]*)<\/td>/gi)
  if (!cells) return null

  // Trouver la cellule contenant TOULON LA SEYNE
  let tlsttCellIdx = -1
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].match(/TOULON\s*LA\s*SEYNE/i)) {
      tlsttCellIdx = i
      break
    }
  }

  if (tlsttCellIdx === -1) return null

  const extractVal = (cell: string) => parseInt(cell.replace(/<[^>]*>/g, '').trim()) || 0

  // Le rang est la cellule avant le nom
  const cla = tlsttCellIdx > 0 ? extractVal(cells[tlsttCellIdx - 1]) : 0
  // Les stats sont dans les cellules suivantes: joue, pts, vic, nul, def
  const joue = tlsttCellIdx + 1 < cells.length ? extractVal(cells[tlsttCellIdx + 1]) : 0
  const pts = tlsttCellIdx + 2 < cells.length ? extractVal(cells[tlsttCellIdx + 2]) : 0
  const vic = tlsttCellIdx + 3 < cells.length ? extractVal(cells[tlsttCellIdx + 3]) : 0
  const nul = tlsttCellIdx + 4 < cells.length ? extractVal(cells[tlsttCellIdx + 4]) : 0
  const def = tlsttCellIdx + 5 < cells.length ? extractVal(cells[tlsttCellIdx + 5]) : 0

  return { cla, joue, pts, vic, def, nul }
}