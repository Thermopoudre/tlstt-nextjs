'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import ImageUpload from '@/components/admin/ImageUpload'
import ConfirmModal from '@/components/admin/ConfirmModal'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

export default function AdminNewsletterPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'compose' | 'sent'>('subscribers')
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [newsletters, setNewsletters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Compose form
  const [compose, setCompose] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    status: 'draft' as 'draft' | 'published',
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const supabase = createClient()
    
    const [{ data: subs }, { data: nls }] = await Promise.all([
      supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }),
      supabase.from('newsletters').select('*').order('created_at', { ascending: false }),
    ])

    if (subs) setSubscribers(subs)
    if (nls) setNewsletters(nls)
    setLoading(false)
  }

  const handleExport = () => {
    setExporting(true)
    const active = subscribers.filter(s => s.is_subscribed)
    const csv = [
      'Email,Prénom,Nom,Date inscription',
      ...active.map(s => 
        `"${s.email}","${s.first_name || ''}","${s.last_name || ''}","${new Date(s.created_at).toLocaleDateString('fr-FR')}"`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `newsletter-tlstt-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setExporting(false)
  }

  const handleSaveNewsletter = async () => {
    if (!compose.title || !compose.content) {
      setMessage({ type: 'error', text: 'Le titre et le contenu sont obligatoires' })
      return
    }

    setSaving(true)
    setMessage(null)
    const supabase = createClient()

    const data = {
      title: compose.title,
      excerpt: compose.excerpt,
      content: compose.content,
      cover_image_url: compose.cover_image_url || null,
      status: compose.status,
      published_at: compose.status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    let error
    let newId: number | null = null
    if (editingId) {
      ({ error } = await supabase.from('newsletters').update(data).eq('id', editingId))
      newId = editingId
    } else {
      const result = await supabase.from('newsletters').insert(data).select('id').single()
      error = result.error
      newId = result.data?.id || null
    }

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      // Auto-ping moteurs de recherche si publié
      if (compose.status === 'published' && newId) {
        fetch('/api/seo/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `/newsletters/${newId}`,
            type: 'newsletter',
          }),
        }).catch(() => {})
      }
      setMessage({ type: 'success', text: editingId ? 'Newsletter mise à jour !' : 'Newsletter créée !' })
      resetCompose()
      setActiveTab('sent')
      await loadAll()
    }
    setSaving(false)
  }

  const handleEditNewsletter = (nl: any) => {
    setCompose({
      title: nl.title,
      excerpt: nl.excerpt || '',
      content: nl.content,
      cover_image_url: nl.cover_image_url || '',
      status: nl.status || 'draft',
    })
    setEditingId(nl.id)
    setActiveTab('compose')
  }

  const handleDeleteNewsletter = async () => {
    if (!deleteTarget) return
    const supabase = createClient()
    await supabase.from('newsletters').delete().eq('id', deleteTarget)
    setDeleteTarget(null)
    await loadAll()
  }

  const resetCompose = () => {
    setCompose({ title: '', excerpt: '', content: '', cover_image_url: '', status: 'draft' })
    setEditingId(null)
  }

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.is_subscribed).length,
    unsubscribed: subscribers.filter(s => !s.is_subscribed).length,
  }

  if (loading) {
    return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            <i className="fas fa-envelope-open-text mr-2 text-primary"></i>
            Newsletter
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos abonnés et composez vos newsletters</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow">
        {[
          { id: 'subscribers' as const, label: 'Abonnés', icon: 'fa-users', count: stats.active },
          { id: 'compose' as const, label: editingId ? 'Modifier' : 'Rédiger', icon: 'fa-pen-fancy' },
          { id: 'sent' as const, label: 'Newsletters', icon: 'fa-newspaper', count: newsletters.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'compose') resetCompose() }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SUBSCRIBERS TAB */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-500">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-gray-600 text-sm">Total inscriptions</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500">
              <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
              <div className="text-gray-600 text-sm">Abonnés actifs</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-red-500">
              <div className="text-3xl font-bold text-gray-900">{stats.unsubscribed}</div>
              <div className="text-gray-600 text-sm">Désabonnés</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleExport} disabled={exporting || stats.active === 0}
              className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
              <i className="fas fa-download"></i>
              Exporter CSV ({stats.active} actifs)
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {subscribers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <i className="fas fa-inbox text-4xl mb-3 block"></i>
                <p>Aucun abonné pour le moment</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sub.first_name || sub.last_name ? `${sub.first_name || ''} ${sub.last_name || ''}`.trim() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(sub.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          sub.is_subscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.is_subscribed ? 'Actif' : 'Désabonné'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* COMPOSE TAB */}
      {activeTab === 'compose' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <i className="fas fa-heading mr-1 text-primary"></i>
              Titre de la newsletter *
            </label>
            <input type="text" value={compose.title}
              onChange={(e) => setCompose({ ...compose, title: e.target.value })}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Ex: Newsletter Février 2026 - Résultats et événements" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <ImageUpload value={compose.cover_image_url}
              onChange={(url) => setCompose({ ...compose, cover_image_url: url })}
              folder="newsletters" label="Image de couverture" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <i className="fas fa-align-left mr-1 text-primary"></i>
              Résumé
              <span className="font-normal text-gray-400 ml-2">(aperçu dans la liste)</span>
            </label>
            <textarea value={compose.excerpt}
              onChange={(e) => setCompose({ ...compose, excerpt: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Un court résumé de cette newsletter..." />
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              <i className="fas fa-file-alt mr-1 text-primary"></i>
              Contenu *
            </label>
            <RichTextEditor
              content={compose.content}
              onChange={(html) => setCompose({ ...compose, content: html })}
              placeholder="Rédigez le contenu de votre newsletter..."
              storageFolder="newsletters"
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <i className="fas fa-eye mr-1 text-primary"></i>
              Statut
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setCompose({ ...compose, status: 'draft' })}
                className={`p-3 rounded-lg text-center transition-colors ${
                  compose.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <i className="fas fa-pencil-alt text-lg mb-1 block"></i>
                <span className="text-sm font-medium">Brouillon</span>
                <p className="text-xs mt-0.5 opacity-70">Non visible sur le site</p>
              </button>
              <button type="button" onClick={() => setCompose({ ...compose, status: 'published' })}
                className={`p-3 rounded-lg text-center transition-colors ${
                  compose.status === 'published' ? 'bg-green-100 text-green-800 border-2 border-green-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <i className="fas fa-globe text-lg mb-1 block"></i>
                <span className="text-sm font-medium">Publier</span>
                <p className="text-xs mt-0.5 opacity-70">Visible sur la page newsletters</p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow">
            <button type="button" onClick={() => { resetCompose(); setActiveTab('sent') }}
              className="text-gray-600 hover:text-gray-900 font-semibold">
              <i className="fas fa-arrow-left mr-2"></i>Annuler
            </button>
            <button onClick={handleSaveNewsletter} disabled={saving}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:bg-gray-400">
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>...</> : <><i className="fas fa-save mr-2"></i>{editingId ? 'Mettre à jour' : 'Enregistrer'}</>}
            </button>
          </div>
        </div>
      )}

      {/* SENT/NEWSLETTERS TAB */}
      {activeTab === 'sent' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => { resetCompose(); setActiveTab('compose') }}
              className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 flex items-center gap-2">
              <i className="fas fa-plus"></i>
              Nouvelle newsletter
            </button>
          </div>

          {newsletters.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
              <i className="fas fa-newspaper text-4xl mb-3 block"></i>
              <p className="text-lg mb-2">Aucune newsletter</p>
              <p className="text-sm">Cliquez sur &quot;Nouvelle newsletter&quot; pour en créer une</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {newsletters.map(nl => (
                <div key={nl.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{nl.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          nl.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {nl.status === 'published' ? 'Publiée' : 'Brouillon'}
                        </span>
                      </div>
                      {nl.excerpt && <p className="text-gray-600 text-sm mb-2">{nl.excerpt}</p>}
                      <p className="text-xs text-gray-400">
                        <i className="fas fa-clock mr-1"></i>
                        {new Date(nl.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditNewsletter(nl)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Modifier">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => setDeleteTarget(nl.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal isOpen={deleteTarget !== null} onConfirm={handleDeleteNewsletter}
        onCancel={() => setDeleteTarget(null)} title="Supprimer la newsletter"
        message="Êtes-vous sûr de vouloir supprimer cette newsletter ?" confirmText="Supprimer" />
    </div>
  )
}
