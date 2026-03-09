'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const MEDAL_OPTIONS = [
  { value: 'or', label: 'Or', icon: 'fa-trophy', color: 'text-yellow-500' },
  { value: 'argent', label: 'Argent', icon: 'fa-medal', color: 'text-gray-400' },
  { value: 'bronze', label: 'Bronze', icon: 'fa-medal', color: 'text-orange-500' },
  { value: 'participation', label: 'Participation', icon: 'fa-star', color: 'text-blue-500' },
]

const defaultForm = { year: new Date().getFullYear(), competition: '', result: '', category: '', players: '', notes: '', medal_type: 'or', is_active: true }

export default function AdminPalmaresPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState<any>(defaultForm)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('palmares').select('*').order('year', { ascending: false }).order('medal_type')
    setItems(data ?? [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ year: item.year, competition: item.competition, result: item.result, category: item.category ?? '', players: item.players ?? '', notes: item.notes ?? '', medal_type: item.medal_type ?? 'or', is_active: item.is_active })
    setShowForm(true)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const payload = { year: parseInt(form.year), competition: form.competition, result: form.result, category: form.category || null, players: form.players || null, notes: form.notes || null, medal_type: form.medal_type, is_active: form.is_active }
    if (editItem) {
      await supabase.from('palmares').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id)
    } else {
      await supabase.from('palmares').insert(payload)
    }
    setShowForm(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet item ?')) return
    const supabase = createClient()
    await supabase.from('palmares').delete().eq('id', id)
    loadData()
  }

  const medalConfig = Object.fromEntries(MEDAL_OPTIONS.map(m => [m.value, m]))

  if (loading) return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Palmarès</h1>
          <p className="text-gray-600 mt-1">Gérez les titres et distinctions du club</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <i className="fas fa-plus"></i> Ajouter un titre
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-600">Médaille</th>
              <th className="text-left p-4 font-semibold text-gray-600">Année</th>
              <th className="text-left p-4 font-semibold text-gray-600">Compétition</th>
              <th className="text-left p-4 font-semibold text-gray-600">Résultat</th>
              <th className="text-left p-4 font-semibold text-gray-600">Catégorie</th>
              <th className="text-center p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const medal = medalConfig[item.medal_type] ?? medalConfig.participation
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <i className={`fas ${medal.icon} ${medal.color} mr-2`}></i>
                    <span className="text-xs font-semibold">{medal.label}</span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">{item.year}</td>
                  <td className="p-4 text-gray-700">{item.competition}</td>
                  <td className="p-4 text-gray-600">{item.result}</td>
                  <td className="p-4 text-gray-500 text-xs">{item.category ?? '—'}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-gray-400">Aucun titre. Cliquez sur &quot;Ajouter&quot; pour commencer.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editItem ? 'Modifier' : 'Nouveau titre'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médaille *</label>
                  <select className="w-full border rounded-lg px-3 py-2" value={form.medal_type} onChange={e => setForm({ ...form, medal_type: e.target.value })}>
                    {MEDAL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compétition *</label>
                <input className="w-full border rounded-lg px-3 py-2" value={form.competition} onChange={e => setForm({ ...form, competition: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Résultat *</label>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Champion, Finaliste, 3ème place..." value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <input className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Équipe 1, Individuel..." value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joueurs</label>
                  <input className="w-full border rounded-lg px-3 py-2" placeholder="Noms des joueurs..." value={form.players} onChange={e => setForm({ ...form, players: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full border rounded-lg px-3 py-2 h-20 resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active_p" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="is_active_p" className="text-sm text-gray-700">Visible sur le site</label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={!form.competition || !form.result} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {editItem ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
