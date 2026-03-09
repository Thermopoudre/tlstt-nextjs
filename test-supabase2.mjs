const SUPABASE_URL = 'https://iapvoyhvkzlvpbngwxmq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MzEyNCwiZXhwIjoyMDg0NDE5MTI0fQ.KkBSpNqXlEsKdWRj9cDxNL32Icyl7479AOZmT1J_eHk'
const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }

async function run() {
  // Voir la structure réelle de settings
  const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?limit=3`, {
    headers: { ...h, 'Accept': 'application/json', 'Range-Unit': 'items', 'Prefer': 'return=representation' }
  })
  const raw = await r.text()
  console.log('SETTINGS raw:', raw.substring(0, 500))

  // Essayer la table "site_settings" ou "admin_settings"
  for (const t of ['site_settings', 'admin_settings', 'app_settings', 'config']) {
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1`, { headers: h })
    console.log(`${t}: HTTP ${r2.status}`)
  }

  // Chercher les vrais noms des tables PGRST205 hint
  const toCheck = ['members', 'galerie', 'carousel', 'partenaires']
  for (const t of toCheck) {
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1`, { headers: h })
    const data = await r2.json()
    console.log(`${t}: ${JSON.stringify(data).substring(0, 120)}`)
  }

  // Competitions data
  const comp = await fetch(`${SUPABASE_URL}/rest/v1/competitions?limit=1`, { headers: h })
  const cd = await comp.json()
  console.log('competitions:', JSON.stringify(cd[0]).substring(0, 200))

  // News article #10 details
  const art = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.10`, { headers: h })
  const ad = await art.json()
  if (ad[0]) {
    console.log('Article #10 colonnes:', Object.keys(ad[0]).join(', '))
  }
}
run().catch(console.error)
