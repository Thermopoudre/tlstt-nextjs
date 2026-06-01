'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Communication {
  id: string
  title: string
  content: string
  type: 'info' | 'important' | 'urgent'
  target_audience: string
  sent_at: string | null
  created_at: string
}

const typeLabels: Record<string, string> = { info: 'Information', important: 'Important', urgent: 'Urgent' }
const typeColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  important: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function AdminCommunicationsPage() {
  const [items, setItems] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'info' | 'important' | 'urgent'>('info')
  const [target, setTarget] = useState<'all' | 'active'>('all')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('secretariat_communications')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSending(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type, target_audience: target }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg('❌ ' + (data.error || 'Erreur'))
      } else {
        const emailInfo =
          data.emailStatus === 'sent' ? `${data.sent}/${data.recipients} email(s) envoyé(s)`
          : data.emailStatus === 'smtp_non_configuré' ? 'SMTP non configuré — communication enregistrée, aucun email'
          : data.emailStatus === 'aucun_destinataire' ? 'aucun destinataire opté-in — communication enregistrée'
          : `email: ${data.emailStatus}`
        setMsg(`✅ Communication publiée (${emailInfo}).`)
        setTitle(''); setContent(''); setType('info'); setTarget('all')
        await load()
      }
    } catch {
      setMsg('❌ Erreur réseau')
    }
    setSending(false)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Communications du secrétariat</h1>
        <p className="text-gray-500 text-sm mt-1">
          Publiez un message visible dans l&apos;espace membre et envoyé par email aux membres ayant
          activé les notifications du secrétariat.
        </p>
      </div>

      <form onSubmit={handleSend} className="bg-white rounded-xl shadow-sm p-6 mb-8 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Titre</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Ex : Fermeture du gymnase pendant les vacances" required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as typeof type)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="info">Information</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Destinataires</label>
            <select value={target} onChange={e => setTarget(e.target.value as typeof target)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="all">Tous les membres (opt-in)</option>
              <option value="active">Membres à jour de cotisation (opt-in)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
          <textarea
            value={content} onChange={e => setContent(e.target.value)} rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Votre message…" required
          />
        </div>
        {msg && <p className="text-sm font-medium">{msg}</p>}
        <button type="submit" disabled={sending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50">
          {sending ? 'Envoi…' : 'Publier et envoyer'}
        </button>
      </form>

      <h2 className="text-lg font-bold text-gray-800 mb-3">Historique</h2>
      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">Aucune communication pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[c.type] || typeColors.info}`}>
                  {typeLabels[c.type] || 'Information'}
                </span>
                <span className="text-xs text-gray-400">
                  {c.sent_at ? new Date(c.sent_at).toLocaleString('fr-FR') : 'brouillon'}
                  {c.target_audience === 'active' ? ' · cotisation à jour' : ' · tous'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <p className="text-gray-500 text-sm mt-1 whitespace-pre-line line-clamp-3">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
