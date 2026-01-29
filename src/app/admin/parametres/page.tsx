'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SiteSettings {
  site_name: string
  site_description: string
  club_number: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  postal_code: string
  facebook_url: string
  instagram_url: string
  twitter_url: string
  smartping_app_id: string
  smartping_serie: string
  maintenance_mode: boolean
}

export default function AdminParametresPage() {
  const supabase = createClientComponentClient()
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'TLSTT',
    site_description: 'Toulon La Seyne Tennis de Table',
    club_number: '08830065',
    contact_email: 'contact@tlstt.fr',
    contact_phone: '',
    address: '',
    city: 'La Seyne-sur-Mer',
    postal_code: '83500',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    smartping_app_id: '',
    smartping_serie: '',
    maintenance_mode: false
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'social' | 'api'>('general')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('page', 'global')
      .single()
    
    if (data?.settings) {
      setSettings({ ...settings, ...data.settings })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        page: 'global',
        settings: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'page' })

    if (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } else {
      setMessage({ type: 'success', text: 'Paramètres enregistrés !' })
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: 'fa-cog' },
    { id: 'contact', label: 'Contact', icon: 'fa-address-card' },
    { id: 'social', label: 'Réseaux', icon: 'fa-share-alt' },
    { id: 'api', label: 'API', icon: 'fa-code' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Paramètres</h1>
          <p className="text-gray-600 mt-1">Configuration générale du site</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 lg:px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du site</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de club</label>
                  <input
                    type="text"
                    value={settings.club_number}
                    onChange={(e) => setSettings({...settings, club_number: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({...settings, site_description: e.target.value})}
                  rows={3}
                  className="input-field"
                />
              </div>
              <div className="pt-4 border-t">
                <label className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
                    className="w-5 h-5 text-yellow-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-yellow-800">Mode maintenance</span>
                    <p className="text-sm text-yellow-600">Le site sera inaccessible aux visiteurs</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({...settings, city: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={settings.postal_code}
                    onChange={(e) => setSettings({...settings, postal_code: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fab fa-facebook text-blue-600 mr-2"></i>Facebook
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({...settings, facebook_url: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fab fa-instagram text-pink-600 mr-2"></i>Instagram
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({...settings, instagram_url: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fab fa-twitter text-sky-500 mr-2"></i>Twitter
                </label>
                <input
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={settings.twitter_url}
                  onChange={(e) => setSettings({...settings, twitter_url: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <i className="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                  <div>
                    <p className="font-medium text-yellow-800">Attention</p>
                    <p className="text-sm text-yellow-600">Ces paramètres sont sensibles. Ne les modifiez que si vous savez ce que vous faites.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SmartPing App ID</label>
                <input
                  type="text"
                  value={settings.smartping_app_id}
                  onChange={(e) => setSettings({...settings, smartping_app_id: e.target.value})}
                  className="input-field font-mono"
                  placeholder="SX04..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SmartPing Série</label>
                <input
                  type="text"
                  value={settings.smartping_serie}
                  onChange={(e) => setSettings({...settings, smartping_serie: e.target.value})}
                  className="input-field font-mono"
                  placeholder="X76U5M09QNB6QM8"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
