'use client'

import { useState, useEffect, useCallback } from 'react'

interface Alert {
  id: number
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  link_url?: string
  link_label?: string
  is_active: boolean
  starts_at?: string
  ends_at?: string
  created_at: string
}

const typeLabels = { info: 'Info', warning: 'Avertissement', success: 'Succès', error: 'Urgence' }
const typeColors = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-700',
}
const typeIcons = { info: 'fa-circle-info', warning: 'fa-triangle-exclamation', success: 'fa-circle-check', error: 'fa-circle-exclamation' }

type AlertType = 'info' | 'warning' | 'success' | 'error'

interface FormState {
  message: string
  type: AlertType
  link_url: string
  link_label: string
  is_active: boolean
  starts_at: string
  ends_at: string
}

const emptyForm: FormState = {
  message: '',
  type: 'info',
  link_url: '',
  link_label: '',
  is_active: true,
  starts_at: '',
  ends_at: '',
}

export default function AdminAlertesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/alertes')
      if (res.ok) setAlerts(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (a: Alert) => {
    setForm({
      message: a.message,
      type: a.type,
      link_url: a.link_url || '',
      link_label: a.link_label || '',
      is_active: a.is_active,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : '',
    })
    setEditId(a.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.message.trim()) { setMsg('Le message est requis.'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/admin/alertes/${editId}` : '/api/admin/alertes'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        setMsg(editId ? 'Alerte mise à jour.' : 'Alerte créée.')
        setShowForm(false)
        load()
      } else {
        setMsg('Erreur lors de la sauvegarde.')
      }
    } catch { setMsg('Erreur réseau.') }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette alerte ?')) return
    await fetch(`/api/admin/alertes/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleActive = async (a: Alert) => {
    await fetch(`/api/admin/alertes/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, is_active: !a.is_active }),
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alertes & Bandeaux</h1>
          <p className="text-sm text-gray-500 mt-1">Messages globaux affichés en haut du site</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-plus"></i> Nouvelle alerte
        </button>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm">{msg}</div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editId ? 'Modifier l\'alerte' : 'Nouvelle alerte'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Texte du bandeau affiché aux visiteurs…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                >
                  {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active immédiatement</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien URL (optionnel)</label>
                <input
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  placeholder="/rejoindre ou https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé du lien</label>
                <input
                  value={form.link_label}
                  onChange={e => setForm(f => ({ ...f, link_label: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  placeholder="En savoir plus"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Début (optionnel)</label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin (optionnel)</label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Sauvegarde…</> : <><i className="fas fa-save mr-2"></i>Sauvegarder</>}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-gray-500"><i className="fas fa-spinner fa-spin mr-2"></i>Chargement…</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <i className="fas fa-bell-slash text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Aucune alerte</h3>
          <p className="text-gray-500 text-sm">Créez un bandeau pour informer vos visiteurs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => (
            <div key={a.id} className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-opacity ${!a.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${typeColors[a.type]}`}>
                  <i className={`fas ${typeIcons[a.type]} text-xs`}></i>
                  {typeLabels[a.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium">{a.message}</p>
                  {a.link_url && (
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-link mr-1"></i>
                      {a.link_label || a.link_url} → {a.link_url}
                    </p>
                  )}
                  {(a.starts_at || a.ends_at) && (
                    <p className="text-xs text-gray-400 mt-1">
                      <i className="fas fa-clock mr-1"></i>
                      {a.starts_at ? new Date(a.starts_at).toLocaleString('fr-FR') : 'maintenant'} → {a.ends_at ? new Date(a.ends_at).toLocaleString('fr-FR') : 'indéfini'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${a.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <i className={`fas ${a.is_active ? 'fa-eye' : 'fa-eye-slash'} mr-1`}></i>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-pencil text-xs"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="w-8 h-8 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
