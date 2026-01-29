'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ContactSettings {
  form_enabled: boolean
  email_recipients: string
  subjects: string[]
  auto_reply_enabled: boolean
  auto_reply_message: string
  recaptcha_enabled: boolean
  recaptcha_key: string
}

export default function AdminContactPage() {
  const supabase = createClientComponentClient()
  const [settings, setSettings] = useState<ContactSettings>({
    form_enabled: true,
    email_recipients: 'contact@tlstt.fr',
    subjects: ['Question générale', 'Inscription', 'Partenariat', 'Autre'],
    auto_reply_enabled: true,
    auto_reply_message: 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.',
    recaptcha_enabled: false,
    recaptcha_key: ''
  })
  const [newSubject, setNewSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('page', 'contact')
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
        page: 'contact',
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

  const addSubject = () => {
    if (newSubject.trim() && !settings.subjects.includes(newSubject.trim())) {
      setSettings({
        ...settings,
        subjects: [...settings.subjects, newSubject.trim()]
      })
      setNewSubject('')
    }
  }

  const removeSubject = (subject: string) => {
    setSettings({
      ...settings,
      subjects: settings.subjects.filter(s => s !== subject)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Formulaire de contact</h1>
          <p className="text-gray-600 mt-1">Configuration du formulaire de contact</p>
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
        {/* Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-cog"></i>
            Configuration
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={settings.form_enabled}
                onChange={(e) => setSettings({...settings, form_enabled: e.target.checked})}
                className="w-5 h-5 text-primary rounded"
              />
              <div>
                <span className="font-medium">Formulaire activé</span>
                <p className="text-sm text-gray-500">Afficher le formulaire sur la page contact</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinataires des emails</label>
              <input
                type="text"
                value={settings.email_recipients}
                onChange={(e) => setSettings({...settings, email_recipients: e.target.value})}
                className="input-field"
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Séparez les emails par des virgules</p>
            </div>
          </div>
        </div>

        {/* Sujets */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-list"></i>
            Sujets disponibles
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                className="input-field flex-1"
                placeholder="Nouveau sujet..."
              />
              <button onClick={addSubject} className="btn-primary">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="space-y-2">
              {settings.subjects.map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>{subject}</span>
                  <button
                    onClick={() => removeSubject(subject)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Réponse automatique */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-reply"></i>
            Réponse automatique
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_reply_enabled}
                onChange={(e) => setSettings({...settings, auto_reply_enabled: e.target.checked})}
                className="w-5 h-5 text-primary rounded"
              />
              <div>
                <span className="font-medium">Réponse automatique activée</span>
                <p className="text-sm text-gray-500">Envoyer un email de confirmation aux visiteurs</p>
              </div>
            </label>

            {settings.auto_reply_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message de confirmation</label>
                <textarea
                  value={settings.auto_reply_message}
                  onChange={(e) => setSettings({...settings, auto_reply_message: e.target.value})}
                  rows={4}
                  className="input-field"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
