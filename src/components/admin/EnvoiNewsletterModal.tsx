'use client'

import { useEffect, useState } from 'react'
import type { Groupe } from './GroupesNewsletter'

type Props = {
  isOpen: boolean
  titre: string
  dejaEnvoyeeLe?: string | null
  groupes: Groupe[]
  onCancel: () => void
  onConfirm: (audience: string) => void
  sending: boolean
}

const AUDIENCES_FIXES = [
  { key: 'all', label: 'Tout le monde', detail: 'Tous les membres du site + les abonnés du formulaire public', icon: 'fa-globe' },
  { key: 'members', label: 'Les membres du site', detail: 'Uniquement les personnes qui ont un compte validé', icon: 'fa-id-card' },
  { key: 'subscribers', label: 'Les abonnés externes', detail: 'Uniquement les inscrits via le formulaire « Newsletter » du site', icon: 'fa-envelope' },
]

export default function EnvoiNewsletterModal({ isOpen, titre, dejaEnvoyeeLe, groupes, onCancel, onConfirm, sending }: Props) {
  const [audience, setAudience] = useState('all')
  const [count, setCount] = useState<number | null>(null)
  const [label, setLabel] = useState('')

  useEffect(() => { if (isOpen) { setAudience('all') } }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let annule = false
    setCount(null)
    fetch(`/api/newsletter/send?audience=${encodeURIComponent(audience)}`)
      .then(r => r.json())
      .then(d => { if (!annule) { setCount(typeof d.count === 'number' ? d.count : 0); setLabel(d.label || '') } })
      .catch(() => { if (!annule) setCount(0) })
    return () => { annule = true }
  }, [audience, isOpen])

  if (!isOpen) return null

  const options = [
    ...AUDIENCES_FIXES,
    ...groupes.map(g => ({
      key: `group:${g.id}`,
      label: `Groupe « ${g.name} »`,
      detail: g.description || `${g.membres.length + (g.extra_emails?.length || 0)} personne(s)`,
      icon: 'fa-users',
    })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900"><i className="fas fa-paper-plane mr-2 text-primary"></i>Envoyer la newsletter</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">« {titre} »</p>
          {dejaEnvoyeeLe && (
            <p className="mt-3 text-sm bg-amber-50 text-amber-800 px-3 py-2 rounded-lg">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Déjà envoyée le {new Date(dejaEnvoyeeLe).toLocaleDateString('fr-FR')} — un nouvel envoi arrivera une seconde fois chez les mêmes personnes.
            </p>
          )}
        </div>

        <div className="p-6 space-y-2">
          <p className="text-sm font-bold text-gray-700 mb-2">À qui l'envoyer ?</p>
          {options.map(o => (
            <button type="button" key={o.key} onClick={() => setAudience(o.key)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${
                audience === o.key ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center ${audience === o.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                <i className={`fas ${o.icon}`}></i>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-gray-900">{o.label}</span>
                <span className="block text-xs text-gray-500">{o.detail}</span>
              </span>
              {audience === o.key && <i className="fas fa-check-circle text-primary"></i>}
            </button>
          ))}
          {groupes.length === 0 && (
            <p className="text-xs text-gray-400 italic pt-1">Astuce : créez des groupes (onglet « Groupes ») pour écrire à une partie des membres seulement, par exemple le Bureau.</p>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
            <i className="fas fa-user-friends text-primary"></i>
            {count === null ? <span>Calcul du nombre de destinataires…</span>
              : <span><b>{count}</b> destinataire(s) — {label}</span>}
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onCancel} disabled={sending}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50">Annuler</button>
            <button type="button" onClick={() => onConfirm(audience)} disabled={sending || !count}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:bg-gray-400">
              {sending ? <><i className="fas fa-spinner fa-spin mr-2"></i>Envoi…</> : <><i className="fas fa-paper-plane mr-2"></i>Envoyer à {count ?? '…'} pers.</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
