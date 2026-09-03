'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * Compteur de visites interne (voir /api/track).
 *
 * Sans cookie ni identifiant persistant : la « session » vit uniquement dans
 * l'onglet ouvert (sessionStorage), le temps de distinguer une première page
 * d'une navigation interne. Rien n'est conservé après la fermeture.
 */
export default function MesureAudience() {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const dernierChemin = useRef<string | null>(null)

  const role = String(profile?.role || '')
  const statut: 'anonyme' | 'membre' | 'admin' = !user
    ? 'anonyme'
    : role === 'admin' || role === 'superadmin'
      ? 'admin'
      : 'membre'

  useEffect(() => {
    if (typeof window !== 'undefined') window.__tlsttVisiteur = statut
  }, [statut])

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    if (dernierChemin.current === pathname) return
    dernierChemin.current = pathname

    let premiere = false
    try {
      premiere = !sessionStorage.getItem('tlstt_vu')
      if (premiere) sessionStorage.setItem('tlstt_vu', '1')
    } catch {
      /* navigation privée : on considère simplement la visite comme non nouvelle */
    }

    const corps = JSON.stringify({
      type: 'page',
      chemin: pathname,
      titre: document.title,
      referent: document.referrer || null,
      visiteur: statut,
      nouvelle_visite: premiere,
    })

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([corps], { type: 'application/json' }))
      } else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corps, keepalive: true }).catch(() => {})
      }
    } catch {
      /* jamais bloquant */
    }
  }, [pathname, statut])

  return null
}
