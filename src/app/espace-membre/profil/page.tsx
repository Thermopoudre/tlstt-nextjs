'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const PHONE_REGEX = /^(\+?\d[\d\s\-().]{6,19})?$/
const LICENCE_REGEX = /^(\d{7})?$/

export default function ProfilPage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    licence_fftt: '',
    birth_date: '',
    newsletter_subscribed: true,
    secretariat_notifications: true,
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Changement de mot de passe
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwData, setPwData] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Suppression de compte
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        licence_fftt: profile.licence_fftt || '',
        birth_date: profile.birth_date || '',
        newsletter_subscribed: profile.newsletter_subscribed,
        secretariat_notifications: profile.secretariat_notifications,
      })
    }
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8]"></i>
      </div>
    )
  }

  if (!user) return null

  // Validation côté client du profil
  const validateProfile = (): string | null => {
    const fn = formData.first_name.trim()
    const ln = formData.last_name.trim()
    if (fn.length > 50) return 'Le prénom ne peut pas dépasser 50 caractères.'
    if (ln.length > 50) return 'Le nom ne peut pas dépasser 50 caractères.'
    if (formData.phone && !PHONE_REGEX.test(formData.phone.trim())) {
      return 'Format de téléphone invalide.'
    }
    if (formData.licence_fftt && !LICENCE_REGEX.test(formData.licence_fftt.trim())) {
      return 'Le numéro de licence FFTT doit contenir 7 chiffres.'
    }
    if (formData.birth_date) {
      const bd = new Date(formData.birth_date)
      if (bd > new Date()) return 'La date de naissance ne peut pas être dans le futur.'
    }
    if (formData.address && formData.address.length > 255) {
      return "L'adresse ne peut pas dépasser 255 caractères."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const validationError = validateProfile()
    if (validationError) {
      setError(validationError)
      setSaving(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('member_profiles')
        .update({
          ...formData,
          first_name: formData.first_name.trim() || null,
          last_name: formData.last_name.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          licence_fftt: formData.licence_fftt.trim() || null,
          birth_date: formData.birth_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (pwData.next.length < 8) {
      setPwError('Le nouveau mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (pwData.next !== pwData.confirm) {
      setPwError('Les mots de passe ne correspondent pas.')
      return
    }

    setPwSaving(true)
    try {
      const supabase = createClient()
      // Vérifier l'ancien mdp en se reconnectant
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: pwData.current,
      })
      if (signInError) {
        setPwError('Mot de passe actuel incorrect.')
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: pwData.next })
      if (updateError) throw updateError
      setPwSuccess(true)
      setPwData({ current: '', next: '', confirm: '' })
      setTimeout(() => {
        setPwSuccess(false)
        setShowPwForm(false)
      }, 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe'
      setPwError(message)
    } finally {
      setPwSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper SUPPRIMER pour confirmer.')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      const supabase = createClient()
      // Anonymiser le profil avant suppression
      await supabase
        .from('member_profiles')
        .update({
          first_name: null,
          last_name: null,
          phone: null,
          address: null,
          birth_date: null,
          licence_fftt: null,
          newsletter_subscribed: false,
          secretariat_notifications: false,
        })
        .eq('id', user.id)
      // Déconnexion puis suppression via edge function / admin (selon config Supabase)
      await signOut()
      router.push('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      setDeleteError(message)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-user-circle text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Mon Profil</h1>
              <p className="text-gray-500">Gérez vos informations personnelles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8" noValidate>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
                  <i className="fas fa-exclamation-circle mr-2"></i>{error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6">
                  <i className="fas fa-check-circle mr-2"></i>Profil mis à jour avec succès !
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    maxLength={50}
                    className="w-full bg-[#0a0a0a] border-2 border-[#333] text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] focus:border-[#3b9fd8] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    maxLength={50}
                    className="w-full bg-[#0a0a0a] border-2 border-[#333] text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] focus:border-[#3b9fd8] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-400 text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full bg-[#111] border-2 border-[#333] text-gray-600 px-4 py-3 rounded-lg cursor-not-allowed"
                />
                <p className="text-gray-600 text-xs mt-1">L&apos;email ne peut pas être modifié</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-[#0a0a0a] border-2 border-[#333] text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] focus:border-[#3b9fd8] focus:outline-none transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    N° Licence FFTT
                    <span className="text-gray-600 font-normal ml-1">(7 chiffres)</span>
                  </label>
                  <input
                    type="text"
                    name="licence_fftt"
                    value={formData.licence_fftt}
                    onChange={handleChange}
                    pattern="\d{7}"
                    maxLength={7}
                    className="w-full bg-[#0a0a0a] border-2 border-[#333] text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] focus:border-[#3b9fd8] focus:outline-none transition-colors"
                    placeholder="Ex: 8311494"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-400 text-sm font-semibold mb-2">Date de naissance</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0a0a] border-2 border-[#333] text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] focus:border-[#3b9fd8] focus:outline-none transition-colors"
                />
              </div>

              <div className="mt-6">
                <label className="block text-gray-400 text-sm font-semibold mb-2">Adresse</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  maxLength={255}
                  className="w-full bg-[#0a0a0a] border-2 border-[#333] text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#3b9fd8] focus:border-[#3b9fd8] focus:outline-none transition-colors"
                  placeholder="Votre adresse complète"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-[#333]">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-bell mr-2 text-[#3b9fd8]"></i>
                  Préférences de notifications
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="newsletter_subscribed"
                      checked={formData.newsletter_subscribed}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#3b9fd8] rounded"
                    />
                    <div>
                      <span className="text-white font-semibold">Newsletter du club</span>
                      <p className="text-gray-500 text-sm">Recevez les actualités et événements du club</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="secretariat_notifications"
                      checked={formData.secretariat_notifications}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#3b9fd8] rounded"
                    />
                    <div>
                      <span className="text-white font-semibold">Communications du secrétariat</span>
                      <p className="text-gray-500 text-sm">Informations importantes concernant votre adhésion</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#3b9fd8] text-white py-4 rounded-xl font-bold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement...</>
                  ) : (
                    <><i className="fas fa-save mr-2"></i>Enregistrer les modifications</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut membre */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-id-badge mr-2 text-[#3b9fd8]"></i>
                Statut membre
              </h3>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                profile?.membership_status === 'active'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  profile?.membership_status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                }`}></span>
                {profile?.membership_status === 'active' ? 'Membre actif' : 'En attente de validation'}
              </div>
              {profile?.membership_expires_at && (
                <p className="text-gray-500 text-sm mt-3">
                  <i className="fas fa-calendar mr-2"></i>
                  Expire le {new Date(profile.membership_expires_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            {/* Sécurité — Changement mot de passe */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-shield-alt mr-2 text-[#3b9fd8]"></i>
                Sécurité
              </h3>

              {!showPwForm ? (
                <button
                  onClick={() => setShowPwForm(true)}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white py-3 rounded-lg font-semibold hover:bg-[#222] transition-colors"
                >
                  <i className="fas fa-key mr-2"></i>
                  Changer le mot de passe
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-3" noValidate>
                  {pwError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">
                      <i className="fas fa-exclamation-circle mr-2"></i>{pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm">
                      <i className="fas fa-check-circle mr-2"></i>Mot de passe mis à jour !
                    </div>
                  )}
                  <input
                    type="password"
                    placeholder="Mot de passe actuel"
                    value={pwData.current}
                    onChange={e => setPwData(p => ({ ...p, current: e.target.value }))}
                    required
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#3b9fd8] transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe (min. 8 car.)"
                    value={pwData.next}
                    onChange={e => setPwData(p => ({ ...p, next: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#3b9fd8] transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirmer le nouveau mot de passe"
                    value={pwData.confirm}
                    onChange={e => setPwData(p => ({ ...p, confirm: e.target.value }))}
                    required
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#3b9fd8] transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowPwForm(false); setPwError(''); setPwData({ current: '', next: '', confirm: '' }) }}
                      className="flex-1 border border-[#333] text-gray-400 py-2 rounded-lg text-sm hover:bg-[#111] transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={pwSaving}
                      className="flex-1 bg-[#3b9fd8] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50"
                    >
                      {pwSaving ? <i className="fas fa-spinner fa-spin"></i> : 'Valider'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Zone danger — Suppression compte */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Zone de danger
              </h3>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-lg font-semibold hover:bg-red-500/20 transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Supprimer mon compte
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-400 text-sm">
                    Cette action est <strong>irréversible</strong>. Tapez <strong>SUPPRIMER</strong> pour confirmer.
                  </p>
                  {deleteError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">
                      {deleteError}
                    </div>
                  )}
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full bg-[#0a0a0a] border border-red-500/30 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setDeleteConfirm(false); setDeleteInput(''); setDeleteError('') }}
                      className="flex-1 border border-[#333] text-gray-400 py-2 rounded-lg text-sm hover:bg-[#111] transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting ? <i className="fas fa-spinner fa-spin"></i> : 'Supprimer'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link href="/espace-membre" className="flex items-center justify-center gap-2 text-gray-500 hover:text-[#3b9fd8] transition-colors text-sm">
              <i className="fas fa-arrow-left"></i>
              Retour à l&apos;espace membre
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
