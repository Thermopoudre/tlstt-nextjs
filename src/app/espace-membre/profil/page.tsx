'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export default function ProfilPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    licence_fftt: '',
    birth_date: '',
    newsletter_subscribed: true,
    secretariat_notifications: true
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
        secretariat_notifications: profile.secretariat_notifications
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('member_profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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
            <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8">
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
                <p className="text-gray-600 text-xs mt-1">L'email ne peut pas être modifié</p>
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
                  <label className="block text-gray-400 text-sm font-semibold mb-2">N° Licence FFTT</label>
                  <input
                    type="text"
                    name="licence_fftt"
                    value={formData.licence_fftt}
                    onChange={handleChange}
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

            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-shield-alt mr-2 text-[#3b9fd8]"></i>
                Sécurité
              </h3>
              <button className="w-full bg-[#0a0a0a] border border-[#333] text-white py-3 rounded-lg font-semibold hover:bg-[#222] transition-colors">
                <i className="fas fa-key mr-2"></i>
                Changer le mot de passe
              </button>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Zone de danger
              </h3>
              <button className="w-full bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-lg font-semibold hover:bg-red-500/20 transition-colors">
                <i className="fas fa-trash mr-2"></i>
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
