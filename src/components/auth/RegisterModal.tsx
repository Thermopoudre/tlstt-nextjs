'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    licenceFFTT: '',
    newsletter: true,
    accountType: 'visitor' as 'visitor' | 'member'
  })
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const passwordStrength = (() => {
    const p = formData.password
    if (!p) return { score: 0, label: '', color: '' }
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { score: 1, label: 'Faible', color: 'bg-red-500' }
    if (score <= 2) return { score: 2, label: 'Moyen', color: 'bg-orange-500' }
    if (score <= 3) return { score: 3, label: 'Bon', color: 'bg-yellow-500' }
    if (score <= 4) return { score: 4, label: 'Fort', color: 'bg-green-500' }
    return { score: 5, label: 'Excellent', color: 'bg-green-600' }
  })()

  const canGoStep2 = formData.accountType && formData.firstName && formData.lastName
  const canGoStep3 = formData.email && formData.password.length >= 6 && formData.password === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        licence_fftt: formData.accountType === 'member' ? formData.licenceFFTT : null,
        newsletter_subscribed: formData.newsletter,
        role: formData.accountType,
        is_validated: false,
      } as any)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-check text-4xl text-green-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-[#0f3057] mb-2">Inscription reussie !</h2>
          <p className="text-gray-600 mb-6">
            Un email de confirmation a ete envoye a <strong>{formData.email}</strong>.<br/>
            {formData.accountType === 'member' ? (
              <>Votre compte membre sera valide par le secretariat du club. Vous recevrez une notification une fois votre acces active.</>
            ) : (
              <>Verifiez votre boite mail pour activer votre compte visiteur.</>
            )}
          </p>
          <button onClick={onClose} className="bg-[#5bc0de] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4ab0ce]">
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#0f3057]">
            <i className="fas fa-user-plus mr-2 text-[#5bc0de]"></i>
            Devenir Membre
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-[#5bc0de] text-white' : 'bg-gray-200 text-gray-400'
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-1 mx-1 rounded ${step > s ? 'bg-[#5bc0de]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 flex justify-between mb-4">
          <span className={step === 1 ? 'text-[#5bc0de] font-semibold' : ''}>Profil</span>
          <span className={step === 2 ? 'text-[#5bc0de] font-semibold' : ''}>Compte</span>
          <span className={step === 3 ? 'text-[#5bc0de] font-semibold' : ''}>Validation</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Profil */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accountType: 'member' }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.accountType === 'member'
                        ? 'border-[#5bc0de] bg-[#5bc0de]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className={`fas fa-table-tennis-paddle-ball text-lg mb-1 ${formData.accountType === 'member' ? 'text-[#5bc0de]' : 'text-gray-400'}`}></i>
                    <p className={`text-sm font-semibold ${formData.accountType === 'member' ? 'text-[#0f3057]' : 'text-gray-600'}`}>Membre du club</p>
                    <p className="text-xs text-gray-400">Licencie FFTT</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accountType: 'visitor' }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.accountType === 'visitor'
                        ? 'border-[#5bc0de] bg-[#5bc0de]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className={`fas fa-user text-lg mb-1 ${formData.accountType === 'visitor' ? 'text-[#5bc0de]' : 'text-gray-400'}`}></i>
                    <p className={`text-sm font-semibold ${formData.accountType === 'visitor' ? 'text-[#0f3057]' : 'text-gray-600'}`}>Visiteur</p>
                    <p className="text-xs text-gray-400">Suivre le club</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prenom *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telephone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                  placeholder="06 12 34 56 78" />
              </div>

              {formData.accountType === 'member' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">N Licence FFTT *</label>
                  <input type="text" name="licenceFFTT" value={formData.licenceFFTT} onChange={handleChange}
                    required={formData.accountType === 'member'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                    placeholder="Ex: 8311494" />
                  <p className="text-xs text-gray-500 mt-1">Votre inscription sera validee par le secretariat</p>
                </div>
              )}

              <button type="button" onClick={() => setStep(2)} disabled={!canGoStep2}
                className="w-full bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50">
                Suivant <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </>
          )}

          {/* STEP 2: Compte */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent" />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmer *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent" />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1"><i className="fas fa-times-circle mr-1"></i>Les mots de passe ne correspondent pas</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-500 mt-1"><i className="fas fa-check-circle mr-1"></i>Mots de passe identiques</p>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  <i className="fas fa-arrow-left mr-2"></i>Retour
                </button>
                <button type="button" onClick={() => setStep(3)} disabled={!canGoStep3}
                  className="flex-1 bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50">
                  Suivant <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 mb-3"><i className="fas fa-clipboard-check mr-2 text-[#5bc0de]"></i>Recapitulatif</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Prenom</span><span className="font-medium text-gray-800">{formData.firstName}</span>
                  <span className="text-gray-500">Nom</span><span className="font-medium text-gray-800">{formData.lastName}</span>
                  <span className="text-gray-500">Email</span><span className="font-medium text-gray-800">{formData.email}</span>
                  <span className="text-gray-500">Type</span><span className="font-medium text-gray-800">{formData.accountType === 'member' ? 'Membre' : 'Visiteur'}</span>
                  {formData.licenceFFTT && <><span className="text-gray-500">Licence</span><span className="font-medium text-gray-800">{formData.licenceFFTT}</span></>}
                  {formData.phone && <><span className="text-gray-500">Telephone</span><span className="font-medium text-gray-800">{formData.phone}</span></>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="newsletter" id="newsletter" checked={formData.newsletter} onChange={handleChange}
                  className="w-4 h-4 text-[#5bc0de] rounded" />
                <label htmlFor="newsletter" className="text-sm text-gray-600">
                  Je souhaite recevoir les newsletters et informations du club
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  <i className="fas fa-arrow-left mr-2"></i>Retour
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50">
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Inscription...</>
                  ) : (
                    <><i className="fas fa-user-plus mr-2"></i>S&apos;inscrire</>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà membre ?{' '}
            <button onClick={onSwitchToLogin} className="text-[#5bc0de] font-semibold hover:underline">
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
