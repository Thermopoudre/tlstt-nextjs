'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', role: 'admin' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: adminsList }, { data: { user } }] = await Promise.all([
      supabase.from('admins').select('id, email, name, role, created_at, is_active').order('created_at'),
      supabase.auth.getUser(),
    ])
    setAdmins(adminsList ?? [])
    setCurrentUser(user)
    setLoading(false)
  }

  const handleInvite = async () => {
    if (!form.email || !form.name) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    // Vérifie si l'email existe déjà
    const { data: existing } = await supabase.from('admins').select('id').eq('email', form.email).single()
    if (existing) {
      setError('Cet email est déjà administrateur.')
      setSaving(false)
      return
    }
    const { error: err } = await supabase.from('admins').insert({ email: form.email, name: form.name, role: form.role, is_active: true })
    if (err) {
      setError('Erreur lors de l\'ajout : ' + err.message)
    } else {
      setShowForm(false)
      setForm({ email: '', name: '', role: 'admin' })
      loadData()
    }
    setSaving(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    if (admins.find(a => a.id === id)?.email === currentUser?.email) {
      alert('Vous ne pouvez pas désactiver votre propre compte.')
      return
    }
    const supabase = createClient()
    await supabase.from('admins').update({ is_active: !current }).eq('id', id)
    loadData()
  }

  const handleDelete = async (id: string, email: string) => {
    if (email === currentUser?.email) {
      alert('Vous ne pouvez pas supprimer votre propre compte.')
      return
    }
    if (!confirm(`Supprimer l'administrateur ${email} ?`)) return
    const supabase = createClient()
    await supabase.from('admins').delete().eq('id', id)
    loadData()
  }

  const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrateur', color: 'bg-blue-100 text-blue-700' },
    super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
    editor: { label: 'Éditeur', color: 'bg-green-100 text-green-700' },
  }

  if (loading) return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrateurs</h1>
          <p className="text-gray-600 mt-1">Gérez les comptes ayant accès au back-office</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <i className="fas fa-user-plus"></i> Ajouter un admin
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
        <div className="text-sm text-yellow-800">
          <strong>Note :</strong> Ajouter un email ici autorise l'accès au backoffice après connexion avec cet email via Supabase Auth.
          La personne doit d'abord créer un compte ou être invitée dans Supabase Dashboard → Authentication → Users.
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-600">Administrateur</th>
              <th className="text-left p-4 font-semibold text-gray-600">Rôle</th>
              <th className="text-left p-4 font-semibold text-gray-600">Ajouté le</th>
              <th className="text-center p-4 font-semibold text-gray-600">Statut</th>
              <th className="text-center p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((admin) => {
              const role = roleConfig[admin.role] ?? roleConfig.admin
              const isSelf = admin.email === currentUser?.email
              return (
                <tr key={admin.id} className={`hover:bg-gray-50 ${!admin.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {admin.name?.[0] || admin.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {admin.name || '—'}
                          {isSelf && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Vous</span>}
                        </div>
                        <div className="text-xs text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${role.color}`}>{role.label}</span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleActive(admin.id, admin.is_active)}
                      disabled={isSelf}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                        admin.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } disabled:cursor-not-allowed`}
                    >
                      {admin.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(admin.id, admin.email)}
                      disabled={isSelf}
                      className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              )
            })}
            {admins.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-gray-400">Aucun administrateur trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Ajouter un administrateur</h2>
              <button onClick={() => { setShowForm(false); setError('') }} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  <i className="fas fa-exclamation-circle mr-2"></i>{error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Prénom Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2" placeholder="admin@club.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select className="w-full border rounded-lg px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="editor">Éditeur (contenu uniquement)</option>
                  <option value="admin">Administrateur</option>
                  <option value="super_admin">Super Admin (accès complet)</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setError('') }} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleInvite} disabled={!form.email || !form.name || saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Ajout...</> : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
