import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: players } = await supabase
    .from('players')
    .select('first_name, last_name, fftt_points, smartping_licence')
    .order('fftt_points', { ascending: false })
    .limit(50)

  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Generate HTML that will be converted to PDF by the client
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Classements TLSTT - ${now}</title>
  <style>
    @page { margin: 15mm; size: A4; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; font-size: 11px; line-height: 1.4; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #3b9fd8; padding-bottom: 15px; }
    .header h1 { color: #3b9fd8; font-size: 24px; margin: 0 0 5px; }
    .header p { color: #666; margin: 0; font-size: 12px; }
    h2 { color: #0f3057; font-size: 16px; margin: 20px 0 10px; border-left: 4px solid #3b9fd8; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
    th { background: #0f3057; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
    td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; }
    tr:nth-child(even) td { background: #f8f9fa; }
    .stats { display: inline-block; background: #3b9fd8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px; }
    .footer { text-align: center; color: #999; font-size: 9px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>TLSTT - Classements</h1>
    <p>Toulon La Seyne Tennis de Table | Genere le ${now}</p>
  </div>

  <h2>Classement des equipes</h2>
  <table>
    <thead>
      <tr>
        <th>Equipe</th>
        <th>Division</th>
        <th>Poule</th>
        <th>Cla.</th>
        <th>J</th>
        <th>Pts</th>
        <th>V</th>
        <th>N</th>
        <th>D</th>
      </tr>
    </thead>
    <tbody>
      ${(teams || []).map(t => `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td>${t.division || '-'}</td>
        <td>${t.pool || '-'}</td>
        <td>${t.cla || '-'}</td>
        <td>${t.joue || 0}</td>
        <td><strong>${t.pts || 0}</strong></td>
        <td>${t.vic || 0}</td>
        <td>${t.nul || 0}</td>
        <td>${t.def || 0}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>Classement des joueurs (Top 50)</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Joueur</th>
        <th>Points</th>
        <th>Licence</th>
      </tr>
    </thead>
    <tbody>
      ${(players || []).map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${p.first_name} ${p.last_name}</strong></td>
        <td><span class="stats">${p.fftt_points || 500} pts</span></td>
        <td>${p.smartping_licence || '-'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>TLSTT - Toulon La Seyne Tennis de Table | Club FFTT N. 13830083</p>
    <p>Ce document a ete genere automatiquement depuis le site du club.</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="classements-tlstt-${new Date().toISOString().split('T')[0]}.html"`,
    },
  })
}
