'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Mot de passe oublié : petit formulaire à la place du formulaire de connexion
  const [modeOubli, setModeOubli] = useState(false)
  const [oubliEnvoye, setOubliEnvoye] = useState(false)

  if (!isOpen) return null

  const envoyerLienOubli = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Indiquez votre adresse email pour recevoir le lien.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/mot-de-passe',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOubliEnvoye(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      onClose()
      router.push('/espace-membre')
    } catch (err: any) {
      const msg = String(err?.message || '')
      setError(/invalid login credentials/i.test(msg)
        ? 'Email ou mot de passe incorrect. Si vous avez déjà un compte, utilisez « Mot de passe oublié ? » ci-dessous.'
        : /email not confirmed/i.test(msg)
          ? 'Votre adresse email n’a pas encore été confirmée : cliquez le lien reçu par email (vérifiez vos spams).'
          : msg || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#0f3057]">
            <i className="fas fa-user-circle mr-2 text-[#5bc0de]"></i>
            Connexion Membre
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {modeOubli ? (
          oubliEnvoye ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-envelope-open-text text-2xl text-green-500"></i>
              </div>
              <p className="font-semibold text-gray-800">Email envoyé</p>
              <p className="text-gray-500 text-sm mt-1">Si un compte existe pour <strong>{email}</strong>, vous allez recevoir un lien pour choisir un nouveau mot de passe. Pensez à vérifier vos spams.</p>
              <button type="button" onClick={() => { setModeOubli(false); setOubliEnvoye(false) }} className="mt-4 text-[#5bc0de] font-semibold hover:underline">Retour à la connexion</button>
            </div>
          ) : (
            <form onSubmit={envoyerLienOubli} className="space-y-4">
              <p className="text-gray-600 text-sm">Indiquez votre email : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                placeholder="votre@email.com" />
              <button type="submit" disabled={loading}
                className="w-full bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50">
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Envoi...</> : <><i className="fas fa-paper-plane mr-2"></i>Recevoir le lien</>}
              </button>
              <button type="button" onClick={() => setModeOubli(false)} className="w-full text-sm text-gray-500 hover:text-[#5bc0de]">
                <i className="fas fa-arrow-left mr-1"></i>Retour à la connexion
              </button>
            </form>
          )
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Connexion...</>
            ) : (
              <><i className="fas fa-sign-in-alt mr-2"></i>Se connecter</>
            )}
          </button>
        </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas encore membre ?{' '}
            <button onClick={onSwitchToRegister} className="text-[#5bc0de] font-semibold hover:underline">
              Créer un compte
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          {!modeOubli && (
            <button type="button" onClick={() => { setError(''); setModeOubli(true) }} className="text-sm text-gray-500 hover:text-[#5bc0de] underline">
              Mot de passe oublié ?
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
