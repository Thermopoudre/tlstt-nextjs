'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Training {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  activity_name: string
  activity_type: string
  description: string | null
  level: string | null
  is_active: boolean
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const TYPES: Record<string, string> = { jeunes: 'Jeunes', dirige: 'Dirige', libre: 'Libre', competition: 'Competition' }

export default function AdminPlanningPage() {
  const supabase = createClient()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Training | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    day_of_week: 1, start_time: '17:30', end_time: '19:00',
    activity_name: '', activity_type: 'libre', description: '',
    level: '', is_active: true,
  })

  useEffect(() => { fetchTrainings() }, [])

  const fetchTrainings = async () => {
    const { data } = await supabase.from('trainings').select('*').order('day_of_week').order('start_time')
    if (data) setTrainings(data)
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ day_of_week: 1, start_time: '17:30', end_time: '19:00', activity_name: '', activity_type: 'libre', description: '', level: '', is_active: true })
    setShowForm(true)
  }

  const openEdit = (t: Training) => {
    setEditing(t)
    setForm({
      day_of_week: t.day_of_week, start_time: t.start_time?.slice(0, 5) || '17:30', end_time: t.end_time?.slice(0, 5) || '19:00',
      activity_name: t.activity_name, activity_type: t.activity_type, description: t.description || '',
      level: t.level || '', is_active: t.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, description: form.description || null, level: form.level || null }
    if (editing) {
      await supabase.from('trainings').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('trainings').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    fetchTrainings()
  }

  const deleteTraining = async (id: string) => {
    if (!confirm('Supprimer ce creneau ?')) return
    await supabase.from('trainings').delete().eq('id', id)
    fetchTrainings()
  }

  const toggleActive = async (t: Training) => {
    await supabase.from('trainings').update({ is_active: !t.is_active }).eq('id', t.id)
    fetchTrainings()
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'jeunes': return 'bg-green-100 text-green-800'
      case 'dirige': return 'bg-blue-100 text-blue-800'
      case 'competition': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Planning</h1>
          <p className="text-gray-600 mt-1">Gerez les creneaux d&apos;entrainement</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouveau creneau
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Total creneaux</p>
          <p className="text-2xl font-bold text-primary">{trainings.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Actifs</p>
          <p className="text-2xl font-bold text-green-600">{trainings.filter(t => t.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Jeunes</p>
          <p className="text-2xl font-bold text-purple-600">{trainings.filter(t => t.activity_type === 'jeunes').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Diriges</p>
          <p className="text-2xl font-bold text-blue-600">{trainings.filter(t => t.activity_type === 'dirige').length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : trainings.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucun creneau</h3>
          <button onClick={openNew} className="btn-primary mt-4"><i className="fas fa-plus mr-2"></i>Ajouter</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Jour</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Horaires</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Activite</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainings.map(t => (
                <tr key={t.id} className={`hover:bg-gray-50 ${!t.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{DAYS[(t.day_of_week || 1) - 1]}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.start_time?.slice(0, 5)} - {t.end_time?.slice(0, 5)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{t.activity_name}</p>
                    {t.level && <p className="text-xs text-gray-500">{t.level}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(t.activity_type)}`}>{TYPES[t.activity_type] || t.activity_type}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(t)} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                    <button onClick={() => deleteTraining(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowForm(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{editing ? 'Modifier le creneau' : 'Nouveau creneau'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom de l&apos;activite *</label>
                  <input type="text" required value={form.activity_name} onChange={e => setForm({ ...form, activity_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ecole de Ping" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jour</label>
                    <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Debut</label>
                    <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fin</label>
                    <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Niveau</label>
                    <input type="text" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Tous niveaux" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-sm font-semibold text-gray-700">Actif</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>...</> : <><i className="fas fa-save mr-2"></i>{editing ? 'Modifier' : 'Ajouter'}</>}
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
