'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  const supabase = createClientComponentClient()
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
      setSettings({ ...settings, ...data.settings })
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Page d'accueil</h1>
          <p className="text-gray-600 mt-1">Personnalisez le contenu de votre page d'accueil</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Hero */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-star"></i>
            Section Hero
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal</label>
              <input
                type="text"
                value={settings.hero_title}
                onChange={(e) => setSettings({...settings, hero_title: e.target.value})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <input
                type="text"
                value={settings.hero_subtitle}
                onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})}
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                <input
                  type="text"
                  value={settings.hero_cta_text}
                  onChange={(e) => setSettings({...settings, hero_cta_text: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien du bouton</label>
                <input
                  type="text"
                  value={settings.hero_cta_link}
                  onChange={(e) => setSettings({...settings, hero_cta_link: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar"></i>
            Statistiques
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de membres</label>
              <input
                type="number"
                value={settings.stats_members}
                onChange={(e) => setSettings({...settings, stats_members: parseInt(e.target.value)})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'équipes</label>
              <input
                type="number"
                value={settings.stats_teams}
                onChange={(e) => setSettings({...settings, stats_teams: parseInt(e.target.value)})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
              <input
                type="number"
                value={settings.stats_years}
                onChange={(e) => setSettings({...settings, stats_years: parseInt(e.target.value)})}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Sections affichées */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-eye"></i>
            Sections à afficher
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={settings.show_news}
                onChange={(e) => setSettings({...settings, show_news: e.target.checked})}
                className="w-5 h-5 text-primary rounded"
              />
              <span className="font-medium">Actualités</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={settings.show_partners}
                onChange={(e) => setSettings({...settings, show_partners: e.target.checked})}
                className="w-5 h-5 text-primary rounded"
              />
              <span className="font-medium">Partenaires</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={settings.show_labels}
                onChange={(e) => setSettings({...settings, show_labels: e.target.checked})}
                className="w-5 h-5 text-primary rounded"
              />
              <span className="font-medium">Labels FFTT</span>
            </label>
          </div>
        </div>
      </div>

      {/* Aperçu */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <i className="fas fa-desktop"></i>
          Aperçu
        </h2>
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-white text-center">
          <h3 className="text-3xl lg:text-4xl font-bold mb-2">{settings.hero_title}</h3>
          <p className="text-lg lg:text-xl text-white/80 mb-4">{settings.hero_subtitle}</p>
          <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold">
            {settings.hero_cta_text}
          </button>
          <div className="flex justify-center gap-8 mt-8">
            <div>
              <p className="text-3xl font-bold">{settings.stats_members}+</p>
              <p className="text-white/70">Membres</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{settings.stats_teams}</p>
              <p className="text-white/70">Équipes</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{settings.stats_years}</p>
              <p className="text-white/70">Années</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
