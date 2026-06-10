import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op VOLONTAIRE : le middleware ne reecrit PLUS les cookies de session.
          // La reecriture des cookies chunkes a chaque requete corrompait la session cote client
          // (le navigateur ne pouvait plus relire la session -> purge -> deconnexion admin).
          // Le client navigateur (singleton) gere seul le refresh/ecriture, comme l'espace membre (stable).
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT : getSession() decode le cookie localement (aucun appel reseau).
  // getUser() faisait un appel serveur->Supabase Auth qui, sous la limite de connexions,
  // echouait par intermittence et faisait PURGER le cookie de session (deconnexions admin).
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const pathname = request.nextUrl.pathname

  // Protect admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Redirect logged-in users away from admin login
  if (pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Protect member area
  if (pathname.startsWith('/espace-membre') && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}
