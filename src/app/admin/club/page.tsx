'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ClubSettings {
  name: string
  description: string
  history: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  latitude: string
  longitude: string
  opening_hours: string
  president: string
  secretary: string
  treasurer: string
}

export default function AdminClubPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<ClubSettings>({
    name: 'Toulon La Seyne Tennis de Table',
    description: 'Club de tennis de table affilié à la FFTT',
    history: '',
    address: '',
    city: 'La Seyne-sur-Mer',
    postal_code: '83500',
    phone: '',
    email: 'contact@tlstt.fr',
    latitude: '',
    longitude: '',
    opening_hours: '',
    president: '',
    secretary: '',
    treasurer: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('page', 'club').single()
    if (data?.settings) setSettings({ ...settings, ...data.settings })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from('site_settings').upsert({ page: 'club', settings, updated_at: new Date().toISOString() }, { onConflict: 'page' })
    setMessage(error ? { type: 'error', text: 'Erreur lors de la sauvegarde' } : { type: 'success', text: 'Modifications enregistrées !' })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">À propos du club</h1>
          <p className="text-gray-600 mt-1">Informations affichées sur la page "À propos"</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du club</label>
              <input type="text" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={settings.description} onChange={(e) => setSettings({...settings, description: e.target.value})} rows={2} className="input-field" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Bureau</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Président(e)</label>
              <input type="text" value={settings.president} onChange={(e) => setSettings({...settings, president: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secrétaire</label>
              <input type="text" value={settings.secretary} onChange={(e) => setSettings({...settings, secretary: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trésorier(e)</label>
              <input type="text" value={settings.treasurer} onChange={(e) => setSettings({...settings, treasurer: e.target.value})} className="input-field" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Localisation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input type="text" value={settings.postal_code} onChange={(e) => setSettings({...settings, postal_code: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input type="text" value={settings.city} onChange={(e) => setSettings({...settings, city: e.target.value})} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Contact</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} className="input-field" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
