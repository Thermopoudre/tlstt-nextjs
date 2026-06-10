import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Ne fait tourner la session/getUser QUE sur les zones protégées.
// Avant, le middleware s'exécutait sur chaque page (y compris le flot de prefetch),
// ce qui multipliait les appels getUser concurrents et saturait l'Auth Supabase
// (limité à 10 connexions) -> sessions révoquées / déconnexions.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/admin/:path*', '/espace-membre/:path*'],
}
