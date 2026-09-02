import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase « public » pour les pages du site visibles par tout le monde.
 *
 * Il n'ouvre PAS les cookies de session. C'est essentiel : dès qu'un composant
 * serveur lit les cookies (client SSR classique), Next.js considère la page
 * comme dynamique et la régénère à chaque visite — le cache (`revalidate`)
 * devient inopérant. Avec ce client, les pages publiques sont mises en cache
 * et servies en quelques millisecondes.
 *
 * À n'utiliser QUE pour des données lisibles publiquement (RLS lecture ouverte).
 * Pour tout ce qui dépend de l'utilisateur connecté, garder `createClient()`
 * de `./server`.
 */
let instance: SupabaseClient | null = null

export function createPublicClient(): SupabaseClient {
  if (instance) return instance
  instance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  )
  return instance
}
