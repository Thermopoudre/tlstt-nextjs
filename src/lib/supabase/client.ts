import { createBrowserClient } from '@supabase/ssr'

// Verrou d'authentification EN MÉMOIRE.
// supabase-js utilise par défaut le verrou natif `navigator.locks` (avec un AbortSignal)
// pour sérialiser les opérations d'auth. Sous contention (plusieurs requêtes .from() au
// chargement, refresh de token...), ce verrou lève par intermittence
// "AbortError: signal is aborted without reason" -> la session devient instable
// (lectures en anonyme = listes vides, écritures refusées en silence, écrans qui tournent).
// On le remplace par une simple file d'attente de promesses : même garantie de
// sérialisation DANS l'onglet, mais SANS AbortSignal -> plus d'AbortError.
let lockChain: Promise<unknown> = Promise.resolve()
async function memoryLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const run = lockChain.then(() => fn(), () => fn())
  // on neutralise le résultat/erreur pour la file, sans casser la chaîne
  lockChain = run.then(() => undefined, () => undefined)
  return run
}

// Construit le client navigateur (singleton ci-dessous).
function build() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: memoryLock,
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
