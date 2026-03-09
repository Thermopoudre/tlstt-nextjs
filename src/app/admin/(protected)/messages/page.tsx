'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replySent, setReplySent] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setMessages(data)
    setLoading(false)
  }

  const handleMarkAsRead = async (id: number) => {
    const supabase = createClient()
    await supabase.from('contact_messages').update({ status: 'read' }).eq('id', id)
    await loadMessages()
  }

  const handleMarkAllAsRead = async () => {
    const supabase = createClient()
    await supabase.from('contact_messages').update({ status: 'read' }).eq('status', 'new')
    await loadMessages()
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return
    setReplySending(true)
    try {
      await fetch('/api/admin/reply-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: selectedMessage.id, to: selectedMessage.email, name: selectedMessage.name, replyText }),
      })
      setReplySent(true)
      setReplyText('')
      if (selectedMessage.status === 'new') await handleMarkAsRead(selectedMessage.id)
    } finally {
      setReplySending(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleteTargetId(id)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    const supabase = createClient()
    await supabase
      .from('contact_messages')
      .delete()
      .eq('id', deleteTargetId)

    if (selectedMessage?.id === deleteTargetId) setSelectedMessage(null)
    setDeleteTargetId(null)
    await loadMessages()
  }

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
  }

  if (loading) {
    return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Messages reçus via le formulaire de contact</p>
        </div>
        {stats.new > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2"
          >
            <i className="fas fa-check-double"></i>
            Tout marquer comme lu ({stats.new})
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-gray-600">Total</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-3xl font-bold text-gray-900">{stats.new}</div>
          <div className="text-gray-600">Non lus</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-gray-500">
          <div className="text-3xl font-bold text-gray-900">{stats.read}</div>
          <div className="text-gray-600">Lus</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste messages */}
        <div className="bg-white rounded-lg shadow overflow-hidden max-h-[600px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => { setSelectedMessage(msg); setReplyText(''); setReplySent(false) }}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
              } ${msg.status === 'new' ? 'bg-green-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{msg.name}</h3>
                  <p className="text-sm text-gray-600">{msg.email}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{msg.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {msg.status === 'new' && (
                    <span className="bg-green-500 text-white px-2 py-1 text-xs rounded-full">Nouveau</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.id) }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(msg.created_at).toLocaleDateString('fr-FR')} à {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>

        {/* Détail message */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedMessage ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails du message</h2>
                {selectedMessage.status === 'new' && (
                  <button
                    onClick={() => handleMarkAsRead(selectedMessage.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Marquer comme lu
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-gray-900 font-semibold">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">
                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                      {selectedMessage.email}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="text-gray-900">{selectedMessage.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reçu le</label>
                  <p className="text-gray-900">
                    {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Formulaire de réponse intégré */}
              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-reply text-primary"></i>
                  Répondre à {selectedMessage.name}
                </h3>
                {replySent && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                    <i className="fas fa-check-circle"></i> Réponse envoyée avec succès !
                  </div>
                )}
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={`Écrivez votre réponse à ${selectedMessage.name}...`}
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); setReplySent(false) }}
                />
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || replySending}
                    className="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {replySending ? <><i className="fas fa-spinner fa-spin"></i> Envoi...</> : <><i className="fas fa-paper-plane"></i> Envoyer</>}
                  </button>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.name}&body=Bonjour ${selectedMessage.name},%0D%0A%0D%0A`}
                    className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-external-link"></i>
                    Client mail
                  </a>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="ml-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 inline-flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-trash"></i>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <i className="fas fa-envelope text-6xl mb-4"></i>
              <p>Sélectionnez un message pour voir les détails</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        title="Supprimer le message"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmText="Supprimer"
      />
    </div>
  )
}
