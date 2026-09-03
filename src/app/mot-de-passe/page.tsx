'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type OtpType = 'invite' | 'recovery' | 'signup' | 'email'

/**
 * Page publique « Nouveau mot de passe » : cible du lien « Mot de passe oublié ? »
 * de la fenêtre de connexion. Accepte tous les formats de lien Supabase
 * (token_hash, code PKCE ou #access_token) et propose un renvoi si le lien a expiré.
 */
export default function NouveauMotDePassePage() {
  const supabase = createClient()
  const router = useRouter()
  const [verification, setVerification] = useState(true)
  const [sessionOk, setSessionOk] = useState(false)
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [voir, setVoir] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [termine, setTermine] = useState(false)
  const [emailRenvoi, setEmailRenvoi] = useState('')
  const [messageRenvoi, setMessageRenvoi] = useState('')
  const [renvoi, setRenvoi] = useState(false)

  useEffect(() => {
    let actif = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session && actif) { setSessionOk(true); setVerification(false) }
    })
    async function etablir() {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const tokenHash = url.searchParams.get('token_hash')
        const type = (url.searchParams.get('type') || 'recovery') as OtpType
        if (tokenHash) await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        else if (code) await supabase.auth.exchangeCodeForSession(code)
      } catch { /* lien invalide : formulaire de renvoi */ }
      const { data } = await supabase.auth.getSession()
      if (!actif) return
      if (data.session) setSessionOk(true)
      setVerification(false)
    }
    etablir()
    return () => { actif = false; subscription.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (motDePasse.length < 6) { setErreur('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (motDePasse !== confirmation) { setErreur('Les deux mots de passe ne sont pas identiques.'); return }
    setEnregistrement(true)
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    setEnregistrement(false)
    if (error) { setErreur(error.message); return }
    setTermine(true)
    setTimeout(() => router.push('/espace-membre'), 2000)
  }

  const demanderLien = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRenvoi) return
    setRenvoi(true)
    setMessageRenvoi('')
    const { error } = await supabase.auth.resetPasswordForEmail(emailRenvoi.trim(), {
      redirectTo: window.location.origin + '/mot-de-passe',
    })
    setRenvoi(false)
    setMessageRenvoi(error
      ? 'Erreur : ' + error.message
      : 'Si un compte existe pour cette adresse, un email vient de partir. Pensez à regarder dans les spams.')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#3b9fd8]/15 mx-auto mb-3 flex items-center justify-center">
            <i className="fas fa-key text-2xl text-[#3b9fd8]"></i>
          </div>
          <h1 className="text-2xl font-bold text-[#0f3057]">Nouveau mot de passe</h1>
          <p className="text-gray-500 text-sm mt-1">Espace membre TLSTT</p>
        </div>

        {verification && (
          <div className="text-center text-gray-500 py-6">
            <i className="fas fa-spinner fa-spin text-2xl text-[#3b9fd8] mb-2"></i>
            <p>Vérification du lien…</p>
          </div>
        )}

        {!verification && !sessionOk && !termine && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm text-center">
              <i className="fas fa-triangle-exclamation mr-1"></i>
              Ce lien est invalide ou a expiré. Indiquez votre email pour en recevoir un nouveau.
            </div>
            <form onSubmit={demanderLien} className="space-y-3">
              <input type="email" value={emailRenvoi} onChange={(e) => setEmailRenvoi(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] text-gray-900"
                placeholder="votre.email@exemple.com" />
              <button type="submit" disabled={renvoi}
                className="w-full bg-[#3b9fd8] text-white py-3 rounded-lg font-semibold hover:bg-[#2d8bc9] disabled:opacity-60">
                {renvoi ? <i className="fas fa-spinner fa-spin"></i> : 'Recevoir un nouveau lien'}
              </button>
              {messageRenvoi && <p className="text-sm text-center text-gray-600">{messageRenvoi}</p>}
            </form>
            <p className="text-center text-sm"><Link href="/" className="text-[#3b9fd8] hover:underline">Retour au site</Link></p>
          </div>
        )}

        {!verification && sessionOk && !termine && (
          <form onSubmit={enregistrer} className="space-y-4">
            {erreur && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                <i className="fas fa-exclamation-circle mr-2"></i>{erreur}
              </div>
            )}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <input type={voir ? 'text' : 'password'} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] text-gray-900"
                  placeholder="6 caractères minimum" autoComplete="new-password" required />
                <button type="button" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`fas ${voir ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Confirmer le mot de passe</label>
              <input type={voir ? 'text' : 'password'} value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] text-gray-900"
                autoComplete="new-password" required />
            </div>
            <button type="submit" disabled={enregistrement}
              className="w-full bg-[#3b9fd8] text-white py-3 rounded-lg font-semibold hover:bg-[#2d8bc9] disabled:opacity-60">
              {enregistrement ? <i className="fas fa-spinner fa-spin"></i> : 'Enregistrer mon mot de passe'}
            </button>
          </form>
        )}

        {termine && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-check text-3xl text-green-500"></i>
            </div>
            <p className="font-semibold text-gray-800">Mot de passe enregistré !</p>
            <p className="text-gray-500 text-sm mt-1">Vous êtes connecté. Redirection vers votre espace membre…</p>
          </div>
        )}
      </div>
    </div>
  )
}
