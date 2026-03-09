'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGE_TYPES = [
  { value: 'vacances', label: 'Stages Vacances', icon: 'fa-sun', color: 'orange' },
  { value: 'perfectionnement', label: 'Perfectionnement', icon: 'fa-chart-line', color: 'blue' },
  { value: 'jeunes', label: 'Stages Jeunes', icon: 'fa-child', color: 'green' },
  { value: 'handisport', label: 'Handisport', icon: 'fa-wheelchair', color: 'purple' },
]

const emptyForm = {
  title: '',
  type: 'vacances',
  description: '',
  date_debut: '',
  date_fin: '',
  lieu: '',
  capacite: 20,
  inscrits: 0,
  age_min: '',
  age_max: '',
  prix: '',
  animateur: '',
  contact_email: '',
  contact_phone: '',
  is_active: true,
  is_published: false,
}

export default function AdminStagesPage() {
  const [stages, setStages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tableError, setTableError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .order('date_debut', { ascending: false })

    if (error?.code === '42P01') {
      setTableError(true)
    } else {
      setStages(data ?? [])
    }
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (s: any) => {
    setEditItem(s)
    setForm({
      title: s.title,
      type: s.type,
      description: s.description ?? '',
      date_debut: s.date_debut ?? '',
      date_fin: s.date_fin ?? '',
      lieu: s.lieu ?? '',
      capacite: s.capacite ?? 20,
      inscrits: s.inscrits ?? 0,
      age_min: s.age_min ?? '',
      age_max: s.age_max ?? '',
      prix: s.prix ?? '',
      animateur: s.animateur ?? '',
      contact_email: s.contact_email ?? '',
      contact_phone: s.contact_phone ?? '',
      is_active: s.is_active,
      is_published: s.is_published,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      ...form,
      age_min: form.age_min === '' ? null : Number(form.age_min),
      age_max: form.age_max === '' ? null : Number(form.age_max),
      prix: form.prix === '' ? null : Number(form.prix),
      capacite: Number(form.capacite),
      inscrits: Number(form.inscrits),
      updated_at: new Date().toISOString(),
    }

    if (editItem) {
      await supabase.from('stages').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('stages').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce stage ?')) return
    const supabase = createClient()
    await supabase.from('stages').delete().eq('id', id)
    loadData()
  }

  const togglePublished = async (id: number, current: boolean) => {
    const supabase = createClient()
    await supabase.from('stages').update({ is_published: !current, updated_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  const filtered = filterType === 'all' ? stages : stages.filter(s => s.type === filterType)

  const getTypeInfo = (type: string) => STAGE_TYPES.find(t => t.value === type) ?? STAGE_TYPES[0]

  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (loading) return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>

  if (tableError) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stages</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <i className="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
          <p className="text-yellow-800 font-semibold mb-2">Table &quot;stages&quot; introuvable</p>
          <p className="text-yellow-700 text-sm">
            Appliquez la migration <code className="bg-yellow-100 px-1 rounded">008_stages.sql</code> via Supabase Dashboard → SQL Editor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stages</h1>
          <p className="text-gray-600 mt-1">{stages.length} stage{stages.length > 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <i className="fas fa-plus"></i> Nouveau stage
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Tous ({stages.length})
        </button>
        {STAGE_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === t.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <i className={`fas ${t.icon} mr-1.5`}></i>
            {t.label} ({stages.filter(s => s.type === t.value).length})
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map((s) => {
          const typeInfo = getTypeInfo(s.type)
          const isFull = s.inscrits >= s.capacite
          const isPast = s.date_fin && new Date(s.date_fin) < new Date()
          return (
            <div key={s.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  s.type === 'vacances' ? 'bg-orange-100 text-orange-600' :
                  s.type === 'perfectionnement' ? 'bg-blue-100 text-blue-600' :
                  s.type === 'jeunes' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <i className={`fas ${typeInfo.icon}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        {s.date_debut && <span><i className="fas fa-calendar mr-1"></i>{formatDate(s.date_debut)} → {formatDate(s.date_fin)}</span>}
                        {s.lieu && <span><i className="fas fa-map-marker-alt mr-1"></i>{s.lieu}</span>}
                        {s.animateur && <span><i className="fas fa-user mr-1"></i>{s.animateur}</span>}
                        {s.prix && <span><i className="fas fa-euro-sign mr-1"></i>{s.prix}€</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{typeInfo.label}</span>
                        {s.age_min || s.age_max ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {s.age_min && s.age_max ? `${s.age_min}-${s.age_max} ans` : s.age_min ? `${s.age_min}+ ans` : `≤${s.age_max} ans`}
                          </span>
                        ) : null}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-700'}`}>
                          {s.inscrits}/{s.capacite} places
                        </span>
                        {isPast && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Passé</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => togglePublished(s.id, s.is_published)}
                        className={`text-xs px-2 py-1 rounded-full ${s.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {s.is_published ? 'Publié' : 'Brouillon'}
                      </button>
                      <button onClick={() => openEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
            Aucun stage. Cliquez sur &quot;Nouveau stage&quot; pour commencer.
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editItem ? 'Modifier le stage' : 'Nouveau stage'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex : Stage Toussaint 2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select className="w-full border rounded-lg px-3 py-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {STAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} placeholder="Salle ASPTT Toulon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Animateur</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={form.animateur} onChange={e => setForm({ ...form, animateur: e.target.value })} placeholder="Prénom Nom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                  <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} placeholder="80" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité max</label>
                  <input type="number" min="1" className="w-full border rounded-lg px-3 py-2" value={form.capacite} onChange={e => setForm({ ...form, capacite: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inscrits</label>
                  <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.inscrits} onChange={e => setForm({ ...form, inscrits: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge min</label>
                  <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.age_min} onChange={e => setForm({ ...form, age_min: e.target.value })} placeholder="7" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge max</label>
                  <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.age_max} onChange={e => setForm({ ...form, age_max: e.target.value })} placeholder="18" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email contact</label>
                  <input type="email" className="w-full border rounded-lg px-3 py-2" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone contact</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 h-28 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Détails du stage..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_published" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                  <label htmlFor="is_published" className="text-sm text-gray-700">Publié sur le site</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Actif</label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white z-10">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button
                onClick={handleSave}
                disabled={!form.title || !form.date_debut || !form.date_fin || saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <i className="fas fa-spinner fa-spin"></i>}
                {editItem ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
