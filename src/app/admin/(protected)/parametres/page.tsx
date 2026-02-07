'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminParametresPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState({
    site_name: 'TLSTT',
    site_description: 'Toulon La Seyne Tennis de Table',
    club_number: '08830065',
    contact_email: 'contact@tlstt.fr',
    contact_phone: '',
    address: '',
    city: 'La Seyne-sur-Mer',
    postal_code: '83500',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('page', 'global').single()
    if (data?.settings) setSettings((prev) => ({ ...prev, ...data.settings }))
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ page: 'global', settings, updated_at: new Date().toISOString() }, { onConflict: 'page' })
    setMessage(error ? { type: 'error', text: 'Erreur' } : { type: 'success', text: 'Enregistré !' })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Paramètres</h1>
          <p className="text-gray-600 mt-1">Configuration générale</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {message && <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du site</label>
            <input type="text" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={settings.contact_email} onChange={(e) => setSettings({...settings, contact_email: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input type="text" value={settings.city} onChange={(e) => setSettings({...settings, city: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
            <input type="text" value={settings.postal_code} onChange={(e) => setSettings({...settings, postal_code: e.target.value})} className="input-field" />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
