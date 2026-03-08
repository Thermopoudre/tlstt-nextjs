'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Label {
  id: string
  name: string
  description: string | null
  image_url: string
  display_order: number
  is_active: boolean
}

export default function AdminLabelsPage() {
  const supabase = createClient()
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => { fetchLabels() }, [])

  const fetchLabels = async () => {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .order('display_order')
    if (data) setLabels(data)
    setLoading(false)
  }

  const openNewForm = () => {
    setEditingLabel(null)
    setForm({ name: '', description: '', image_url: '', display_order: labels.length, is_active: true })
    setShowForm(true)
  }

  const openEditForm = (label: Label) => {
    setEditingLabel(label)
    setForm({
      name: label.name,
      description: label.description || '',
      image_url: label.image_url,
      display_order: label.display_order,
      is_active: label.is_active
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (editingLabel) {
      await supabase
        .from('labels')
        .update({
          name: form.name,
          description: form.description || null,
          image_url: form.image_url,
          display_order: form.display_order,
          is_active: form.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLabel.id)
    } else {
      await supabase
        .from('labels')
        .insert({
          name: form.name,
          description: form.description || null,
          image_url: form.image_url,
          display_order: form.display_order,
          is_active: form.is_active
        })
    }

    setSaving(false)
    setShowForm(false)
    setEditingLabel(null)
    fetchLabels()
  }

  const toggleActive = async (label: Label) => {
    await supabase
      .from('labels')
      .update({ is_active: !label.is_active, updated_at: new Date().toISOString() })
      .eq('id', label.id)
    fetchLabels()
  }

  const deleteLabel = async (id: string) => {
    if (!confirm('Supprimer ce label ?')) return
    await supabase.from('labels').delete().eq('id', id)
    fetchLabels()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Labels FFTT</h1>
          <p className="text-gray-600 mt-1">Gerez les labels et certifications du club</p>
        </div>
        <button onClick={openNewForm} className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Ajouter un label
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Total labels</p>
          <p className="text-2xl font-bold text-primary">{labels.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Actifs</p>
          <p className="text-2xl font-bold text-green-600">{labels.filter(l => l.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Inactifs</p>
          <p className="text-2xl font-bold text-gray-400">{labels.filter(l => !l.is_active).length}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          Les labels sont affiches sur la page d&apos;accueil du site. Vous pouvez uploader les images des labels
          dans Supabase Storage et utiliser l&apos;URL publique, ou utiliser une URL externe.
        </p>
      </div>

      {/* Labels List */}
      {loading ? (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
        </div>
      ) : labels.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-award text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucun label</h3>
          <p className="text-gray-500 mb-4">Ajoutez votre premier label FFTT</p>
          <button onClick={openNewForm} className="btn-primary">
            <i className="fas fa-plus mr-2"></i>Ajouter un label
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labels.map(label => (
            <div key={label.id} className={`bg-white rounded-xl shadow overflow-hidden ${!label.is_active ? 'opacity-60' : ''}`}>
              <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                {label.image_url ? (
                  <img
                    src={label.image_url}
                    alt={label.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = '<i class="fas fa-image text-4xl text-gray-300"></i>'
                    }}
                  />
                ) : (
                  <i className="fas fa-image text-4xl text-gray-300"></i>
                )}
                {!label.is_active && (
                  <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    Inactif
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1">{label.name}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{label.description || 'Pas de description'}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Ordre: {label.display_order}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(label)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        label.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label.is_active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => openEditForm(label)}
                      className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => deleteLabel(label.id)}
                      className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowForm(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingLabel ? 'Modifier le label' : 'Ajouter un label'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du label *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="ex: Label Ecole Francaise de Tennis de Table"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Description du label..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">URL de l&apos;image *</label>
                  <input
                    type="url"
                    required
                    value={form.image_url}
                    onChange={e => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://... ou /images/labels/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Uploadez l&apos;image dans Supabase Storage puis collez l&apos;URL publique
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ordre d&apos;affichage</label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        className="w-5 h-5 rounded text-primary"
                      />
                      <span className="text-sm font-semibold text-gray-700">Actif</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement...</>
                    ) : (
                      <><i className="fas fa-save mr-2"></i>{editingLabel ? 'Modifier' : 'Ajouter'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
