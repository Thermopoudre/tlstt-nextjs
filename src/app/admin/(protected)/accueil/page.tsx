'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HomepageSettings {
  id?: number
  hero_title: string
  hero_subtitle: string
  hero_cta_text: string
  hero_cta_link: string
  stats_members: number
  stats_teams: number
  stats_years: number
  training_schedule: string
  show_news: boolean
  show_partners: boolean
  show_labels: boolean
}

export default function AdminAccueilPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<HomepageSettings>({
    hero_title: 'TLSTT',
    hero_subtitle: 'Tennis de Table à Toulon La Seyne',
    hero_cta_text: 'Découvrir le club',
    hero_cta_link: '/club/a-propos',
    stats_members: 221,
    stats_teams: 8,
    stats_years: 30,
    training_schedule: '',
    show_news: true,
    show_partners: true,
    show_labels: true
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('page', 'homepage')
      .single()
    
    if (data?.settings) {
      setSettings((prev) => ({ ...prev, ...data.settings }))
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        page: 'homepage',
        settings: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'page' })

    if (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } else {
      setMessage({ type: 'success', text: 'Modifications enregistrées !' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Page d'accueil</h1>
          <p className="text-gray-600 mt-1">Personnalisez le contenu de votre page d'accueil</p>
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

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Section Hero</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal</label>
              <input type="text" value={settings.hero_title} onChange={(e) => setSettings({...settings, hero_title: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <input type="text" value={settings.hero_subtitle} onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})} className="input-field" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Statistiques</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de membres</label>
              <input type="number" value={settings.stats_members} onChange={(e) => setSettings({...settings, stats_members: parseInt(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'équipes</label>
              <input type="number" value={settings.stats_teams} onChange={(e) => setSettings({...settings, stats_teams: parseInt(e.target.value)})} className="input-field" />
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
