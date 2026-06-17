import { createBrowserClient } from '@supabase/ssr'

// Verrou d'authentification NEUTRE (no-op).
// supabase-js utilise par défaut le verrou natif `navigator.locks` (avec AbortSignal)
// pour sérialiser les opérations d'auth entre onglets. Sous contention (plusieurs
// requêtes .from() au chargement, refresh de token...), ce verrou lève par intermittence
// "AbortError: signal is aborted without reason" -> session instable (listes vides,
// écritures refusées en silence, écrans qui tournent en boucle).
// On exécute directement la fonction, sans navigator.locks et sans AbortSignal :
// plus d'AbortError, et aucun risque de blocage (supabase-js dé-doublonne déjà les
// rafraîchissements de token en interne, et le client est un singleton sur l'onglet).
async function noOpLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  return await fn()
}

// Construit le client navigateur (singleton ci-dessous).
function build() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noOpLock,
      },
    }
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
