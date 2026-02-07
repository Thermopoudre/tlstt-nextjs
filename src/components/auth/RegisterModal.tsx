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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de compte */}
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
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              placeholder="06 12 34 56 78"
            />
          </div>

          {formData.accountType === 'member' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">N Licence FFTT *</label>
              <input
                type="text"
                name="licenceFFTT"
                value={formData.licenceFFTT}
                onChange={handleChange}
                required={formData.accountType === 'member'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                placeholder="Ex: 8311494"
              />
              <p className="text-xs text-gray-500 mt-1">Votre inscription sera validee par le secretariat</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmer *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="newsletter"
              id="newsletter"
              checked={formData.newsletter}
              onChange={handleChange}
              className="w-4 h-4 text-[#5bc0de] rounded"
            />
            <label htmlFor="newsletter" className="text-sm text-gray-600">
              Je souhaite recevoir les newsletters et informations du club
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Inscription...</>
            ) : (
              <><i className="fas fa-user-plus mr-2"></i>S'inscrire</>
            )}
          </button>
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
