'use client'

import { createClient } from './client'

/**
 * Client Supabase pour les écrans d'administration.
 *
 * Identique au client habituel, à un détail près : si une écriture échoue
 * (colonne inexistante, droit refusé, champ obligatoire manquant…), l'erreur
 * est signalée à l'écran au lieu de disparaître en silence. Sans cela, un
 * formulaire se ferme comme si tout s'était bien passé et la modification est
 * perdue sans que personne ne le sache.
 */

let derniereErreur = ''
let derniereErreurAt = 0

export function signalerErreurSupabase(error: { message?: string; code?: string; details?: string } | null) {
  if (!error) return
  const message = error.message || error.details || 'Erreur inconnue'
  const maintenant = Date.now()
  // évite d'afficher deux fois le même message coup sur coup
  if (message === derniereErreur && maintenant - derniereErreurAt < 3000) return
  derniereErreur = message
  derniereErreurAt = maintenant
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tlstt:erreur-admin', { detail: { message, code: error.code } }))
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function surveiller(cible: any): any {
  return new Proxy(cible, {
    get(target, prop, receiver) {
      const valeur = Reflect.get(target, prop, receiver)
      if (prop === 'then' && typeof valeur === 'function') {
        return (onOk: any, onKo: any) =>
          valeur.call(
            target,
            (res: any) => {
              if (res && res.error) signalerErreurSupabase(res.error)
              return onOk ? onOk(res) : res
            },
            onKo
          )
      }
      if (typeof valeur === 'function') {
        return (...args: any[]) => {
          const sortie = valeur.apply(target, args)
          return sortie && typeof sortie === 'object' && typeof sortie.then === 'function'
            ? surveiller(sortie)
            : sortie
        }
      }
      return valeur
    },
  }) as ReturnType<typeof createClient>
}

export function createUiClient(): ReturnType<typeof createClient> {
  const sb: any = createClient()
  return new Proxy(sb, {
    get(target, prop, receiver) {
      const valeur = Reflect.get(target, prop, receiver)
      if (prop === 'from' && typeof valeur === 'function') {
        return (...args: any[]) => surveiller(valeur.apply(target, args))
      }
      return valeur
    },
  }) as ReturnType<typeof createClient>
}
