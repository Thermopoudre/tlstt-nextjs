'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Competition {
  id: number
  date: string
  time: string | null
  team_name: string
  opponent: string
  location: string | null
  type: 'domicile' | 'exterieur'
  division: string | null
  result: string | null
  score_for: number | null
  score_against: number | null
  status: 'upcoming' | 'completed' | 'cancelled'
  notes: string | null
}

export default function AdminCompetitionsPage() {
  const supabase = createClient()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Competition | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: '', time: '14:00', team_name: '', opponent: '',
    location: '', type: 'domicile' as string, division: '',
    result: '', score_for: '', score_against: '',
    status: 'upcoming' as string, notes: '',
  })

  useEffect(() => { fetchCompetitions() }, [])

  const fetchCompetitions = async () => {
    const { data } = await supabase.from('competitions').select('*').order('date', { ascending: false })
    if (data) setCompetitions(data)
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ date: '', time: '14:00', team_name: '', opponent: '', location: '', type: 'domicile', division: '', result: '', score_for: '', score_against: '', status: 'upcoming', notes: '' })
    setShowForm(true)
  }

  const openEdit = (c: Competition) => {
    setEditing(c)
    setForm({
      date: c.date, time: c.time || '14:00', team_name: c.team_name, opponent: c.opponent,
      location: c.location || '', type: c.type, division: c.division || '',
      result: c.result || '', score_for: c.score_for?.toString() || '', score_against: c.score_against?.toString() || '',
      status: c.status, notes: c.notes || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      date: form.date, time: form.time || null, team_name: form.team_name,
      opponent: form.opponent, location: form.location || null, type: form.type,
      division: form.division || null, result: form.result || null,
      score_for: form.score_for ? parseInt(form.score_for) : null,
      score_against: form.score_against ? parseInt(form.score_against) : null,
      status: form.status, notes: form.notes || null,
    }
    if (editing) {
      await supabase.from('competitions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('competitions').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    fetchCompetitions()
  }

  const deleteCompetition = async (id: number) => {
    if (!confirm('Supprimer cette rencontre ?')) return
    await supabase.from('competitions').delete().eq('id', id)
    fetchCompetitions()
  }

  const markCompleted = async (c: Competition) => {
    const result = prompt('Score (ex: 12-6) :', c.result || '')
    if (result === null) return
    const parts = result.split('-').map(s => parseInt(s.trim()))
    await supabase.from('competitions').update({
      status: 'completed', result,
      score_for: parts[0] || null, score_against: parts[1] || null,
    }).eq('id', c.id)
    fetchCompetitions()
  }

  const filteredCompetitions = competitions.filter(c => {
    if (filter === 'upcoming') return c.status === 'upcoming'
    if (filter === 'completed') return c.status === 'completed'
    return true
  })

  const stats = {
    total: competitions.length,
    upcoming: competitions.filter(c => c.status === 'upcoming').length,
    completed: competitions.filter(c => c.status === 'completed').length,
    wins: competitions.filter(c => c.score_for !== null && c.score_against !== null && c.score_for > c.score_against).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Competitions</h1>
          <p className="text-gray-600 mt-1">Calendrier des matchs et resultats</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouvelle rencontre
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-primary">{stats.total}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">A venir</p><p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Terminees</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Victoires</p><p className="text-2xl font-bold text-yellow-600">{stats.wins}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {(['upcoming', 'completed', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'upcoming' ? 'A venir' : f === 'completed' ? 'Terminees' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune competition</h3>
          <button onClick={openNew} className="btn-primary mt-4"><i className="fas fa-plus mr-2"></i>Ajouter</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCompetitions.map(comp => (
            <div key={comp.id} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-primary font-medium">{new Date(comp.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    <span className="text-xl font-bold text-primary">{new Date(comp.date).getDate()}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{comp.team_name}</p>
                    <span className="text-gray-400">vs</span>
                    <p className="font-semibold text-gray-700">{comp.opponent}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {comp.division && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{comp.division}</span>}
                    {comp.location && <span><i className="fas fa-map-marker-alt mr-1"></i>{comp.location}</span>}
                    {comp.time && <span><i className="fas fa-clock mr-1"></i>{comp.time.slice(0, 5)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${comp.type === 'domicile' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    <i className={`fas ${comp.type === 'domicile' ? 'fa-home' : 'fa-car'}`}></i>
                    {comp.type === 'domicile' ? 'Dom.' : 'Ext.'}
                  </span>
                  {comp.status === 'completed' && comp.result && (
                    <span className={`text-lg font-bold ${comp.score_for !== null && comp.score_against !== null ? (comp.score_for > comp.score_against ? 'text-green-600' : comp.score_for < comp.score_against ? 'text-red-600' : 'text-yellow-600') : 'text-gray-700'}`}>
                      {comp.result}
                    </span>
                  )}
                  {comp.status === 'upcoming' && (
                    <button onClick={() => markCompleted(comp)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Saisir le resultat">
                      <i className="fas fa-check-circle"></i>
                    </button>
                  )}
                  <button onClick={() => openEdit(comp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                  <button onClick={() => deleteCompetition(comp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{editing ? 'Modifier la rencontre' : 'Nouvelle rencontre'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                    <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Heure</label>
                    <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Equipe TLSTT *</label>
                    <input type="text" required value={form.team_name} onChange={e => setForm({ ...form, team_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Equipe 1" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Adversaire *</label>
                    <input type="text" required value={form.opponent} onChange={e => setForm({ ...form, opponent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Club adversaire" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lieu</label>
                    <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Gymnase..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="domicile">Domicile</option>
                      <option value="exterieur">Exterieur</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Division</label>
                  <input type="text" value={form.division} onChange={e => setForm({ ...form, division: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Departementale 1" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Statut</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="upcoming">A venir</option>
                      <option value="completed">Termine</option>
                      <option value="cancelled">Annule</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Score pour</label>
                    <input type="number" min="0" value={form.score_for} onChange={e => setForm({ ...form, score_for: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Score contre</label>
                    <input type="number" min="0" value={form.score_against} onChange={e => setForm({ ...form, score_against: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                </div>
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
