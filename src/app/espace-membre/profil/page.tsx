'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

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
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de]"></i>
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
    <div className="min-h-screen bg-[#0f3057]">
      <div className="py-12">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li><Link href="/espace-membre" className="hover:text-[#5bc0de]">Espace Membre</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Mon Profil</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-white mb-2">
            <i className="fas fa-user-circle mr-3 text-[#5bc0de]"></i>
            Mon Profil
          </h1>
          <p className="text-white/60 mb-8">Gérez vos informations personnelles</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white/10 border border-white/20 rounded-2xl p-8">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
                    <i className="fas fa-exclamation-circle mr-2"></i>{error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg mb-6">
                    <i className="fas fa-check-circle mr-2"></i>Profil mis à jour avec succès !
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-semibold mb-2">Prénom</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-semibold mb-2">Nom</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-white/80 text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full bg-white/5 border border-white/10 text-white/50 px-4 py-3 rounded-lg cursor-not-allowed"
                  />
                  <p className="text-white/40 text-xs mt-1">L'email ne peut pas être modifié</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-white/80 text-sm font-semibold mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-semibold mb-2">N° Licence FFTT</label>
                    <input
                      type="text"
                      name="licence_fftt"
                      value={formData.licence_fftt}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                      placeholder="Ex: 8311494"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-white/80 text-sm font-semibold mb-2">Date de naissance</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-white/80 text-sm font-semibold mb-2">Adresse</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
                    placeholder="Votre adresse complète"
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">
                    <i className="fas fa-bell mr-2 text-[#5bc0de]"></i>
                    Préférences de notifications
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="newsletter_subscribed"
                        checked={formData.newsletter_subscribed}
                        onChange={handleChange}
                        className="w-5 h-5 text-[#5bc0de] rounded"
                      />
                      <div>
                        <span className="text-white font-semibold">Newsletter du club</span>
                        <p className="text-white/50 text-sm">Recevez les actualités et événements du club</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="secretariat_notifications"
                        checked={formData.secretariat_notifications}
                        onChange={handleChange}
                        className="w-5 h-5 text-[#5bc0de] rounded"
                      />
                      <div>
                        <span className="text-white font-semibold">Communications du secrétariat</span>
                        <p className="text-white/50 text-sm">Informations importantes concernant votre adhésion</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#5bc0de] text-white py-4 rounded-xl font-bold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50"
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
              <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-id-badge mr-2 text-[#5bc0de]"></i>
                  Statut membre
                </h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                  profile?.membership_status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    profile?.membership_status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></span>
                  {profile?.membership_status === 'active' ? 'Membre actif' : 'En attente de validation'}
                </div>
                {profile?.membership_expires_at && (
                  <p className="text-white/60 text-sm mt-3">
                    <i className="fas fa-calendar mr-2"></i>
                    Expire le {new Date(profile.membership_expires_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-shield-alt mr-2 text-[#5bc0de]"></i>
                  Sécurité
                </h3>
                <button className="w-full bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  <i className="fas fa-key mr-2"></i>
                  Changer le mot de passe
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-400 mb-4">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Zone de danger
                </h3>
                <button className="w-full bg-red-500/20 text-red-400 py-3 rounded-lg font-semibold hover:bg-red-500/30 transition-colors">
                  <i className="fas fa-trash mr-2"></i>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
