'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Team {
  id: string
  name: string
  division: string | null
  pool: string | null
  phase: number
  cla: number
  joue: number
  pts: number
  vic: number
  def: number
  nul: number
  link_fftt: string | null
  is_active: boolean
}

export default function AdminEquipesPage() {
  const supabase = createClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    division: '',
    pool: '',
    phase: 2,
    cla: 0,
    joue: 0,
    pts: 0,
    vic: 0,
    def: 0,
    nul: 0,
    link_fftt: '',
    is_active: true,
  })

  useEffect(() => { fetchTeams() }, [])

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('name')
    if (data) setTeams(data)
    setLoading(false)
  }

  const openNewForm = () => {
    setEditingTeam(null)
    setForm({ name: '', division: '', pool: '', phase: 2, cla: 0, joue: 0, pts: 0, vic: 0, def: 0, nul: 0, link_fftt: '', is_active: true })
    setShowForm(true)
  }

  const openEditForm = (team: Team) => {
    setEditingTeam(team)
    setForm({
      name: team.name,
      division: team.division || '',
      pool: team.pool || '',
      phase: team.phase,
      cla: team.cla,
      joue: team.joue,
      pts: team.pts,
      vic: team.vic,
      def: team.def,
      nul: team.nul,
      link_fftt: team.link_fftt || '',
      is_active: team.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name,
      division: form.division || null,
      pool: form.pool || null,
      phase: form.phase,
      cla: form.cla,
      joue: form.joue,
      pts: form.pts,
      vic: form.vic,
      def: form.def,
      nul: form.nul,
      link_fftt: form.link_fftt || null,
      is_active: form.is_active,
    }

    if (editingTeam) {
      await supabase.from('teams').update(payload).eq('id', editingTeam.id)
    } else {
      await supabase.from('teams').insert(payload)
    }

    setSaving(false)
    setShowForm(false)
    setEditingTeam(null)
    fetchTeams()
  }

  const deleteTeam = async (id: string) => {
    if (!confirm('Supprimer cette equipe ?')) return
    await supabase.from('teams').delete().eq('id', id)
    fetchTeams()
  }

  const toggleActive = async (team: Team) => {
    await supabase.from('teams').update({ is_active: !team.is_active }).eq('id', team.id)
    fetchTeams()
  }

  const totalMatchs = teams.filter(t => t.is_active).reduce((s, t) => s + t.joue, 0)
  const totalVic = teams.filter(t => t.is_active).reduce((s, t) => s + t.vic, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Equipes</h1>
          <p className="text-gray-600 mt-1">Gerez les equipes du club et leurs resultats</p>
        </div>
        <button onClick={openNewForm} className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouvelle equipe
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Total equipes</p>
          <p className="text-2xl font-bold text-primary">{teams.filter(t => t.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Matchs joues</p>
          <p className="text-2xl font-bold text-blue-600">{totalMatchs}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Victoires</p>
          <p className="text-2xl font-bold text-green-600">{totalVic}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Taux victoire</p>
          <p className="text-2xl font-bold text-amber-600">{totalMatchs > 0 ? Math.round((totalVic / totalMatchs) * 100) : 0}%</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          Mettez a jour les resultats apres chaque journee de championnat.
          Les modifications sont visibles immediatement sur la page Equipes du site.
        </p>
      </div>

      {/* Teams list */}
      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-people-group text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune equipe</h3>
          <p className="text-gray-500 mb-4">Ajoutez votre premiere equipe</p>
          <button onClick={openNewForm} className="btn-primary"><i className="fas fa-plus mr-2"></i>Ajouter</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.id} className={`bg-white rounded-xl shadow overflow-hidden ${!team.is_active ? 'opacity-60' : ''}`}>
              <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{team.name}</h3>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                    {team.division || 'Non defini'} {team.pool ? `- ${team.pool}` : ''}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2 text-center mb-4">
                  <div>
                    <p className="text-xl font-bold text-primary">{team.joue}</p>
                    <p className="text-xs text-gray-500">Joues</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{team.vic}</p>
                    <p className="text-xs text-gray-500">V</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-600">{team.nul}</p>
                    <p className="text-xs text-gray-500">N</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">{team.def}</p>
                    <p className="text-xs text-gray-500">D</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600">{team.pts}</p>
                    <p className="text-xs text-gray-500">Pts</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-500">
                    Phase {team.phase} | Cla: {team.cla || '-'}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive(team)} className={`p-2 rounded-lg text-xs ${team.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      <i className={`fas ${team.is_active ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                    <button onClick={() => openEditForm(team)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => deleteTeam(team.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTeam ? `Modifier ${editingTeam.name}` : 'Ajouter une equipe'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="TLSTT 1" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Division</label>
                    <select value={form.division} onChange={e => setForm({ ...form, division: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="">Choisir...</option>
                      <option value="Nationale 3">Nationale 3</option>
                      <option value="Pre-Nationale">Pre-Nationale</option>
                      <option value="Regionale 1">Regionale 1</option>
                      <option value="Regionale 2">Regionale 2</option>
                      <option value="Regionale 3">Regionale 3</option>
                      <option value="Pre-Regionale">Pre-Regionale</option>
                      <option value="Departementale 1">Departementale 1</option>
                      <option value="Departementale 2">Departementale 2</option>
                      <option value="Departementale 3">Departementale 3</option>
                      <option value="Departementale 4">Departementale 4</option>
                      <option value="Departementale 4 Jeunes">Departementale 4 Jeunes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Poule</label>
                    <input type="text" value={form.pool} onChange={e => setForm({ ...form, pool: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Poule 1" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phase</label>
                    <select value={form.phase} onChange={e => setForm({ ...form, phase: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value={1}>Phase 1</option>
                      <option value={2}>Phase 2</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Resultats</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Matchs joues</label>
                      <input type="number" min="0" value={form.joue} onChange={e => setForm({ ...form, joue: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Victoires</label>
                      <input type="number" min="0" value={form.vic} onChange={e => setForm({ ...form, vic: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nuls</label>
                      <input type="number" min="0" value={form.nul} onChange={e => setForm({ ...form, nul: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Defaites</label>
                      <input type="number" min="0" value={form.def} onChange={e => setForm({ ...form, def: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Points</label>
                      <input type="number" min="0" value={form.pts} onChange={e => setForm({ ...form, pts: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Classement</label>
                      <input type="number" min="0" value={form.cla} onChange={e => setForm({ ...form, cla: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lien FFTT / Info</label>
                  <input type="text" value={form.link_fftt} onChange={e => setForm({ ...form, link_fftt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="URL ou info complementaire" />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5 rounded text-primary" />
                  <span className="text-sm font-semibold text-gray-700">Equipe active (visible sur le site)</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement...</> : <><i className="fas fa-save mr-2"></i>{editingTeam ? 'Modifier' : 'Ajouter'}</>}
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
