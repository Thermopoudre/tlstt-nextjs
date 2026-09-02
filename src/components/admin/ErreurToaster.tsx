'use client'

import { useEffect, useState } from 'react'

type Erreur = { id: number; message: string; code?: string }

/**
 * Affiche en bas à droite du back-office les erreurs d'enregistrement
 * qui, auparavant, passaient totalement inaperçues.
 */
export default function ErreurToaster() {
  const [erreurs, setErreurs] = useState<Erreur[]>([])

  useEffect(() => {
    const onErreur = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; code?: string }
      const id = Date.now() + Math.random()
      setErreurs(prev => [...prev, { id, message: detail.message, code: detail.code }])
      setTimeout(() => setErreurs(prev => prev.filter(x => x.id !== id)), 9000)
    }
    window.addEventListener('tlstt:erreur-admin', onErreur)
    return () => window.removeEventListener('tlstt:erreur-admin', onErreur)
  }, [])

  if (erreurs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="alert" aria-live="assertive">
      {erreurs.map(err => (
        <div key={err.id} className="bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-4">
          <p className="font-semibold text-red-700 text-sm">
            <i className="fas fa-triangle-exclamation mr-2"></i>L&apos;enregistrement a échoué
          </p>
          <p className="text-sm text-gray-700 mt-1 break-words">{err.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            Votre modification n&apos;a pas été prise en compte. Réessayez ; si le message revient, notez-le et signalez-le.
          </p>
          <button
            onClick={() => setErreurs(prev => prev.filter(x => x.id !== err.id))}
            className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
          >
            Fermer
          </button>
        </div>
      ))}
    </div>
  )
}
