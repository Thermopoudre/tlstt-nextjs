import { createBrowserClient } from '@supabase/ssr'

// Construit le client navigateur (type identique à l'usage d'origine).
function build() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// SINGLETON : une seule instance partagée par toute l'app.
// Avant, chaque composant appelait createClient() -> une nouvelle instance avec son propre
// rafraîchissement auto de token -> rafraîchissements concurrents qui, sous la limite de
// connexions de l'Auth Supabase, faisaient échouer un refresh -> session révoquée -> déconnexion.
let browserClient: ReturnType<typeof build> | undefined

export function createClient() {
  browserClient ??= build()
  return browserClient
}
