const SUPABASE_URL = 'https://iapvoyhvkzlvpbngwxmq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MzEyNCwiZXhwIjoyMDg0NDE5MTI0fQ.KkBSpNqXlEsKdWRj9cDxNL32Icyl7479AOZmT1J_eHk'
const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }

const tables = [
  'players', 'news', 'teams', 'member_profiles', 'site_settings', 'newsletters',
  'contact_messages', 'albums', 'admins', 'news_likes', 'competitions',
  'carousel_slides', 'trainings', 'newsletter_subscribers', 'tarifs', 'shop_products',
  'partners', 'pages_content', 'settings', 'photos', 'pages', 'labels', 'faq',
  'shop_orders', 'palmares', 'page_blocks', 'alerts', 'gallery', 'profiles',
  'marketplace_listings', 'tarif_categories', 'comments', 'secretariat_communications',
  'players_history', 'faq_categories'
]

const exists = []
const missing = []

for (const t of tables) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1`, { headers: h })
  const data = await r.json()
  if (r.status === 200) {
    exists.push({ name: t, count: data.length })
  } else {
    const hint = data?.hint || ''
    missing.push({ name: t, hint: hint.substring(0, 60) })
  }
}

console.log('\n=== TABLES EXISTANTES ===')
exists.forEach(t => console.log(`  ✓ ${t.name} (${t.count} lignes visibles)`))

console.log('\n=== TABLES MANQUANTES ===')
missing.forEach(t => console.log(`  ✗ ${t.name}${t.hint ? ' → ' + t.hint : ''}`))

console.log(`\n${exists.length} tables OK / ${missing.length} tables manquantes`)
