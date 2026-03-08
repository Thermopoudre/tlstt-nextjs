'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Partner {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  category: string
  position: number
  is_active: boolean
}

const CATEGORIES: Record<string, string> = {
  institutionnel: 'Institutionnel',
  principal: 'Principal',
  premium: 'Premium',
  standard: 'Standard',
}

export default function AdminPartenairesPage() {
  const supabase = createClient()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', logo_url: '', website_url: '',
    category: 'standard', position: 0, is_active: true,
  })

  useEffect(() => { fetchPartners() }, [])

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('position')
    if (data) setPartners(data)
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', description: '', logo_url: '', website_url: '', category: 'standard', position: partners.length, is_active: true })
    setShowForm(true)
  }

  const openEdit = (p: Partner) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', logo_url: p.logo_url || '', website_url: p.website_url || '', category: p.category, position: p.position ?? 0, is_active: p.is_active })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { name: form.name, description: form.description || null, logo_url: form.logo_url || null, website_url: form.website_url || null, category: form.category, position: form.position, is_active: form.is_active }
    if (editing) {
      await supabase.from('partners').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('partners').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    fetchPartners()
  }

  const deletePartner = async (id: string) => {
    if (!confirm('Supprimer ce partenaire ?')) return
    await supabase.from('partners').delete().eq('id', id)
    fetchPartners()
  }

  const toggleActive = async (p: Partner) => {
    await supabase.from('partners').update({ is_active: !p.is_active }).eq('id', p.id)
    fetchPartners()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Partenaires</h1>
          <p className="text-gray-600 mt-1">Gerez vos partenaires et sponsors</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouveau partenaire
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <div key={key} className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-primary">{partners.filter(p => p.category === key).length}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-handshake text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucun partenaire</h3>
          <button onClick={openNew} className="btn-primary mt-4"><i className="fas fa-plus mr-2"></i>Ajouter</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Partenaire</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Categorie</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">Site web</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {partners.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.logo_url ? (
                        <img src={p.logo_url} alt={p.name} className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><i className="fas fa-building text-gray-400"></i></div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{CATEGORIES[p.category] || p.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm">
                    {p.website_url ? <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><i className="fas fa-external-link-alt mr-1"></i>Voir</a> : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(p)} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                    <button onClick={() => deletePartner(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{editing ? `Modifier ${editing.name}` : 'Nouveau partenaire'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="Nom du partenaire" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Categorie</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ordre</label>
                    <input type="number" min="0" value={form.position} onChange={e => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">URL du logo</label>
                  <input type="url" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Site web</label>
                  <input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
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
