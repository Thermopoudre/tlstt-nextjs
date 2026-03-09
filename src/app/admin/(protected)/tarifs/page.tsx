'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminTarifsPage() {
  const [tarifs, setTarifs] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ label: '', price: '', description: '', category_id: '', is_active: true, position: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tarifs').select('*, tarif_categories(name)').order('position'),
      supabase.from('tarif_categories').select('*').order('position'),
    ])
    setTarifs(t ?? [])
    setCategories(c ?? [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ label: '', price: '', description: '', category_id: categories[0]?.id ?? '', is_active: true, position: tarifs.length })
    setShowForm(true)
  }

  const openEdit = (t: any) => {
    setEditItem(t)
    setForm({ label: t.label, price: t.price, description: t.description ?? '', category_id: t.category_id ?? '', is_active: t.is_active, position: t.position })
    setShowForm(true)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const payload = { label: form.label, price: parseFloat(form.price), description: form.description, category_id: form.category_id || null, is_active: form.is_active, position: form.position }
    if (editItem) {
      await supabase.from('tarifs').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('tarifs').insert(payload)
    }
    setShowForm(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce tarif ?')) return
    const supabase = createClient()
    await supabase.from('tarifs').delete().eq('id', id)
    loadData()
  }

  const toggleActive = async (id: number, current: boolean) => {
    const supabase = createClient()
    await supabase.from('tarifs').update({ is_active: !current }).eq('id', id)
    loadData()
  }

  if (loading) return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarifs</h1>
          <p className="text-gray-600 mt-1">Gérez les tarifs d&apos;adhésion affichés sur le site</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <i className="fas fa-plus"></i> Ajouter un tarif
        </button>
      </div>

      {/* Table tarifs */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-600">Libellé</th>
              <th className="text-left p-4 font-semibold text-gray-600">Catégorie</th>
              <th className="text-right p-4 font-semibold text-gray-600">Prix</th>
              <th className="text-center p-4 font-semibold text-gray-600">Actif</th>
              <th className="text-center p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tarifs.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-semibold text-gray-900">{t.label}</div>
                  {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                </td>
                <td className="p-4 text-gray-600">{t.tarif_categories?.name ?? '—'}</td>
                <td className="p-4 text-right font-bold text-primary">{t.price}€</td>
                <td className="p-4 text-center">
                  <button onClick={() => toggleActive(t.id, t.is_active)} className={`w-10 h-6 rounded-full transition-colors ${t.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`block w-4 h-4 bg-white rounded-full mx-auto transition-transform ${t.is_active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                  </button>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><i className="fas fa-edit"></i></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><i className="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
            {tarifs.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-gray-400">Aucun tarif. Cliquez sur &quot;Ajouter&quot; pour commencer.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editItem ? 'Modifier le tarif' : 'Nouveau tarif'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé *</label>
                <input className="w-full border rounded-lg px-3 py-2" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€) *</label>
                  <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select className="w-full border rounded-lg px-3 py-2" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Sans catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border rounded-lg px-3 py-2 h-20 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Actif (visible sur le site)</label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={!form.label || !form.price} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {editItem ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
