const SUPABASE_URL = 'https://iapvoyhvkzlvpbngwxmq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MzEyNCwiZXhwIjoyMDg0NDE5MTI0fQ.KkBSpNqXlEsKdWRj9cDxNL32Icyl7479AOZmT1J_eHk'

const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }

async function q(table, qs = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, { headers: h })
  const data = await r.json()
  return { status: r.status, data }
}

async function run() {
  console.log('\n=== TESTS SUPABASE ===\n')

  // 1. NEWS
  const news = await q('news', '?status=eq.published&order=published_at.desc&limit=3')
  console.log(`[NEWS] HTTP ${news.status} — ${news.data.length} articles publiés`)
  if (news.data[0]) {
    console.log(`  #${news.data[0].id} | "${news.data[0].title?.substring(0, 50)}" | cat: ${news.data[0].category}`)
  }

  // 2. SETTINGS
  const settings = await q('settings', '?limit=10')
  console.log(`[SETTINGS] HTTP ${settings.status} — ${settings.data.length} entrées`)
  settings.data?.forEach(s => console.log(`  ${s.key}: ${String(s.value).substring(0, 40)}`))

  // 3. ADMINS
  const admins = await q('admins', '?limit=3')
  console.log(`[ADMINS] HTTP ${admins.status} — ${Array.isArray(admins.data) ? admins.data.length + ' admins' : JSON.stringify(admins.data).substring(0, 80)}`)
  if (Array.isArray(admins.data)) {
    admins.data.forEach(a => console.log(`  ${a.email} (${a.role})`))
  }

  // 4. Autres tables
  const tables = ['members', 'newsletter_subscribers', 'galerie', 'carousel', 'partenaires', 'planning', 'equipes', 'competitions', 'palmares', 'faq', 'tarifs', 'alerts', 'news_likes']
  console.log('\n[TABLES existantes]')
  for (const t of tables) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1`, { headers: h })
    const txt = await r.text()
    const ok = r.status === 200
    const count = ok ? JSON.parse(txt).length : null
    console.log(`  ${ok ? '✓' : '✗'} ${t} (HTTP ${r.status})${ok ? ` — ${count} entrée(s)` : ' — ' + txt.substring(0, 60)}`)
  }

  // 5. Test RPC exec_sql
  console.log('\n[RPC] Test exec_sql...')
  const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: 'SELECT 1' })
  })
  console.log(`  exec_sql: HTTP ${rpc.status}`)

  // 6. Test version Postgres via RPC
  const version = await fetch(`${SUPABASE_URL}/rest/v1/rpc/version`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  console.log(`  version: HTTP ${version.status}`)

  console.log('\n=== FIN DES TESTS ===')
}

run().catch(console.error)
