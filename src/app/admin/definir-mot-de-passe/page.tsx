'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DefinirMotDePassePage() {
  const supabase = createClient()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Le lien d'invitation établit la session (hash ou code) -> on la détecte.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasSession(true)
        setChecking(false)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true)
    })
    // Laisser le temps à la détection du lien, puis arrêter le "chargement".
    const t = setTimeout(() => setChecking(false), 2500)
    return () => { clearTimeout(t); subscription.unsubscribe() }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => router.push('/admin'), 1800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-light px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">Définir votre mot de passe</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Bienvenue dans l&apos;équipe d&apos;administration du TLSTT.</p>

        {checking && (
          <div className="text-center text-gray-500 py-6">
            <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
            <p>Vérification du lien…</p>
          </div>
        )}

        {!checking && !hasSession && !done && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm text-center">
            <i className="fas fa-triangle-exclamation mr-1"></i>
            Lien invalide ou expiré. Demandez à un administrateur de vous renvoyer une invitation,
            ou utilisez « Mot de passe oublié » sur la page de connexion.
          </div>
        )}

        {!checking && hasSession && !done && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Au moins 8 caractères"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Retapez le mot de passe"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                <i className="fas fa-exclamation-circle mr-2"></i>{error}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement…</> : 'Valider et accéder au back-office'}
            </button>
          </form>
        )}

        {done && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-center">
            <i className="fas fa-check-circle text-2xl mb-2"></i>
            <p>Mot de passe défini ! Redirection vers le back-office…</p>
          </div>
        )}
      </div>
    </div>
  )
}
