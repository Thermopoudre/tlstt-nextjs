'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ question: '', answer: '', category_id: '', is_active: true, position: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.from('faq').select('*, faq_categories(name)').order('position'),
      supabase.from('faq_categories').select('*').order('position'),
    ])
    setFaqs(f ?? [])
    setCategories(c ?? [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ question: '', answer: '', category_id: categories[0]?.id ?? '', is_active: true, position: faqs.length })
    setShowForm(true)
  }

  const openEdit = (f: any) => {
    setEditItem(f)
    setForm({ question: f.question, answer: f.answer, category_id: f.category_id ?? '', is_active: f.is_active, position: f.position })
    setShowForm(true)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const payload = { question: form.question, answer: form.answer, category_id: form.category_id || null, is_active: form.is_active, position: form.position }
    if (editItem) {
      await supabase.from('faq').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id)
    } else {
      await supabase.from('faq').insert(payload)
    }
    setShowForm(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette question ?')) return
    const supabase = createClient()
    await supabase.from('faq').delete().eq('id', id)
    loadData()
  }

  const toggleActive = async (id: number, current: boolean) => {
    const supabase = createClient()
    await supabase.from('faq').update({ is_active: !current }).eq('id', id)
    loadData()
  }

  if (loading) return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ</h1>
          <p className="text-gray-600 mt-1">Gérez les questions fréquentes affichées sur le site</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <i className="fas fa-plus"></i> Ajouter une question
        </button>
      </div>

      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.id} className="bg-white rounded-xl shadow p-5 flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${f.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{f.question}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{f.answer}</p>
                  {f.faq_categories && <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{f.faq_categories.name}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(f.id, f.is_active)} className={`text-xs px-2 py-1 rounded-full ${f.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {f.is_active ? 'Visible' : 'Masqué'}
                  </button>
                  <button onClick={() => openEdit(f)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><i className="fas fa-edit"></i></button>
                  <button onClick={() => handleDelete(f.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><i className="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
            Aucune question. Cliquez sur &quot;Ajouter&quot; pour commencer.
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editItem ? 'Modifier la question' : 'Nouvelle question'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select className="w-full border rounded-lg px-3 py-2" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Sans catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input className="w-full border rounded-lg px-3 py-2" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Réponse *</label>
                <textarea className="w-full border rounded-lg px-3 py-2 h-32 resize-none" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Visible sur le site</label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={!form.question || !form.answer} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {editItem ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
