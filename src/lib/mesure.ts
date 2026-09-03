'use client'

/**
 * Envoi d'un événement de mesure d'audience (voir /api/track).
 * Ne bloque jamais l'interface : en cas d'échec, on ignore silencieusement.
 */
export function mesurer(type: string, options?: { chemin?: string; titre?: string }) {
  if (typeof window === 'undefined') return
  try {
    const corps = JSON.stringify({
      type,
      chemin: options?.chemin || window.location.pathname,
      titre: options?.titre || document.title,
      referent: document.referrer || null,
      visiteur: window.__tlsttVisiteur || 'anonyme',
      nouvelle_visite: false,
    })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([corps], { type: 'application/json' }))
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corps, keepalive: true }).catch(() => {})
    }
  } catch {
    /* la mesure ne doit jamais gêner l'utilisateur */
  }
}

declare global {
  interface Window {
    __tlsttVisiteur?: 'anonyme' | 'membre' | 'admin'
  }
}
