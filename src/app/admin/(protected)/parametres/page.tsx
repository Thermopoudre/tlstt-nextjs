'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminParametresPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'club'>('general')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // General settings
  const [settings, setSettings] = useState({
    site_name: 'TLSTT',
    site_description: 'Toulon La Seyne Tennis de Table',
    club_number: '13830083',
    contact_email: 'contact@tlstt.fr',
    contact_phone: '',
    address: 'Gymnase Léo Lagrange, Avenue Maréchal Juin',
    city: 'La Seyne-sur-Mer',
    postal_code: '83500',
    foundation_year: 1954,
    facebook_url: '',
    instagram_url: '',
    club_description: '',
    nb_tables: 12,
    surface: '800m²',
    nb_licencies: 150,
    nb_equipes: 13,
    nb_entraineurs: 4,
    president_name: '',
    maps_url: '',
  })

  // Contact settings
  const [contactSettings, setContactSettings] = useState({
    subjects: ['Question générale', 'Inscription', 'Partenariat', 'Autre'],
    opening_hours: {
      lundi_vendredi: '17h30 - 23h',
      mercredi: '14h - 23h',
      samedi: '9h - 19h',
      dimanche: 'Compétitions',
    } as Record<string, string>,
  })

  // Club settings
  const [clubSettings, setClubSettings] = useState({
    history: '',
    palmares: [] as { title: string; description: string; icon: string; color: string }[],
    values: [] as { title: string; description: string; icon: string; color: string }[],
    equipments: [] as string[],
  })

  useEffect(() => { fetchAllSettings() }, [])

  const fetchAllSettings = async () => {
    const { data: allSettings } = await supabase.from('site_settings').select('*')
    
    if (allSettings) {
      for (const row of allSettings) {
        if (row.page === 'global' && row.settings) {
          setSettings(prev => ({ ...prev, ...row.settings }))
        }
        if (row.page === 'contact' && row.settings) {
          setContactSettings(prev => ({ ...prev, ...row.settings }))
        }
        if (row.page === 'club' && row.settings) {
          setClubSettings(prev => ({ ...prev, ...row.settings }))
        }
      }
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    let page: string
    let data: any

    if (activeTab === 'general') {
      page = 'global'
      data = settings
    } else if (activeTab === 'contact') {
      page = 'contact'
      data = contactSettings
    } else {
      page = 'club'
      data = clubSettings
    }

    const { error } = await supabase.from('site_settings').upsert(
      { page, settings: data, updated_at: new Date().toISOString() },
      { onConflict: 'page' }
    )

    setMessage(error
      ? { type: 'error', text: 'Erreur lors de la sauvegarde' }
      : { type: 'success', text: 'Paramètres enregistrés !' }
    )
    setSaving(false)
  }

  const addEquipment = () => {
    setClubSettings(prev => ({ ...prev, equipments: [...prev.equipments, ''] }))
  }

  const removeEquipment = (index: number) => {
    setClubSettings(prev => ({
      ...prev,
      equipments: prev.equipments.filter((_, i) => i !== index),
    }))
  }

  const updateEquipment = (index: number, value: string) => {
    setClubSettings(prev => ({
      ...prev,
      equipments: prev.equipments.map((e, i) => i === index ? value : e),
    }))
  }

  const tabs = [
    { id: 'general' as const, label: 'Général', icon: 'fa-cog' },
    { id: 'contact' as const, label: 'Contact & Horaires', icon: 'fa-clock' },
    { id: 'club' as const, label: 'Page À propos', icon: 'fa-info-circle' },
  ]

  if (loading) {
    return <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Paramètres</h1>
          <p className="text-gray-600 mt-1">Configuration du site et du club</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {message && <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-info-circle mr-2 text-primary"></i>
              Identité du club
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du site</label>
                <input type="text" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={settings.site_description} onChange={(e) => setSettings({...settings, site_description: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Club FFTT</label>
                <input type="text" value={settings.club_number} onChange={(e) => setSettings({...settings, club_number: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année de fondation</label>
                <input type="number" value={settings.foundation_year} onChange={(e) => setSettings({...settings, foundation_year: parseInt(e.target.value) || 1954})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du président</label>
                <input type="text" value={settings.president_name} onChange={(e) => setSettings({...settings, president_name: e.target.value})} className="input-field" placeholder="Président du club" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
                <input type="text" value={settings.club_description} onChange={(e) => setSettings({...settings, club_description: e.target.value})} className="input-field" placeholder="Description pour le footer" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-map-marker-alt mr-2 text-primary"></i>
              Coordonnées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                <input type="email" value={settings.contact_email} onChange={(e) => setSettings({...settings, contact_email: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" value={settings.contact_phone} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} className="input-field" placeholder="06 XX XX XX XX" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input type="text" value={settings.city} onChange={(e) => setSettings({...settings, city: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input type="text" value={settings.postal_code} onChange={(e) => setSettings({...settings, postal_code: e.target.value})} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien Google Maps</label>
                <input type="url" value={settings.maps_url} onChange={(e) => setSettings({...settings, maps_url: e.target.value})} className="input-field" placeholder="https://maps.google.com/..." />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-share-alt mr-2 text-primary"></i>
              Réseaux sociaux
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fab fa-facebook mr-1 text-blue-600"></i> Facebook
                </label>
                <input type="url" value={settings.facebook_url} onChange={(e) => setSettings({...settings, facebook_url: e.target.value})} className="input-field" placeholder="https://www.facebook.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fab fa-instagram mr-1 text-pink-600"></i> Instagram
                </label>
                <input type="url" value={settings.instagram_url} onChange={(e) => setSettings({...settings, instagram_url: e.target.value})} className="input-field" placeholder="https://www.instagram.com/..." />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-chart-bar mr-2 text-primary"></i>
              Chiffres clés (affichés sur la page À propos)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nb tables</label>
                <input type="number" value={settings.nb_tables} onChange={(e) => setSettings({...settings, nb_tables: parseInt(e.target.value) || 0})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Surface</label>
                <input type="text" value={settings.surface} onChange={(e) => setSettings({...settings, surface: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Licenciés</label>
                <input type="number" value={settings.nb_licencies} onChange={(e) => setSettings({...settings, nb_licencies: parseInt(e.target.value) || 0})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Équipes</label>
                <input type="number" value={settings.nb_equipes} onChange={(e) => setSettings({...settings, nb_equipes: parseInt(e.target.value) || 0})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entraîneurs</label>
                <input type="number" value={settings.nb_entraineurs} onChange={(e) => setSettings({...settings, nb_entraineurs: parseInt(e.target.value) || 0})} className="input-field" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-clock mr-2 text-primary"></i>
              Horaires d&apos;ouverture
            </h3>
            <p className="text-sm text-gray-500 mb-4">Ces horaires sont affichés sur la page Contact du site.</p>
            <div className="space-y-3">
              {Object.entries(contactSettings.opening_hours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <label className="w-40 text-sm font-medium text-gray-700 capitalize">{day.replace(/_/g, ' - ')}</label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setContactSettings({
                      ...contactSettings,
                      opening_hours: { ...contactSettings.opening_hours, [day]: e.target.value }
                    })}
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-list mr-2 text-primary"></i>
              Sujets du formulaire de contact
            </h3>
            <p className="text-sm text-gray-500 mb-4">Options de sujet proposées aux visiteurs dans le formulaire.</p>
            <div className="space-y-2">
              {contactSettings.subjects.map((subject, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      const newSubjects = [...contactSettings.subjects]
                      newSubjects[index] = e.target.value
                      setContactSettings({ ...contactSettings, subjects: newSubjects })
                    }}
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => setContactSettings({
                      ...contactSettings,
                      subjects: contactSettings.subjects.filter((_, i) => i !== index),
                    })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
              <button
                onClick={() => setContactSettings({
                  ...contactSettings,
                  subjects: [...contactSettings.subjects, ''],
                })}
                className="text-primary hover:underline text-sm font-medium"
              >
                <i className="fas fa-plus mr-1"></i> Ajouter un sujet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Club Tab */}
      {activeTab === 'club' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-history mr-2 text-primary"></i>
              Histoire du club
            </h3>
            <p className="text-sm text-gray-500 mb-2">Texte affiché dans la section &quot;Notre Histoire&quot; de la page À propos. Utilisez **gras** pour mettre en valeur.</p>
            <textarea
              value={clubSettings.history}
              onChange={(e) => setClubSettings({ ...clubSettings, history: e.target.value })}
              rows={8}
              className="input-field font-mono text-sm"
              placeholder="Le **TLSTT** est un club historique..."
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-dumbbell mr-2 text-primary"></i>
              Équipements
            </h3>
            <p className="text-sm text-gray-500 mb-4">Liste des équipements affichée sur la page À propos.</p>
            <div className="space-y-2">
              {clubSettings.equipments.map((eq, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-400"></i>
                  <input
                    type="text"
                    value={eq}
                    onChange={(e) => updateEquipment(index, e.target.value)}
                    className="input-field flex-1"
                  />
                  <button onClick={() => removeEquipment(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
              <button onClick={addEquipment} className="text-primary hover:underline text-sm font-medium">
                <i className="fas fa-plus mr-1"></i> Ajouter un équipement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
