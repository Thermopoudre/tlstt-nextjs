'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ImageUpload from '@/components/admin/ImageUpload'
import ConfirmModal from '@/components/admin/ConfirmModal'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

interface EditActualitePageProps {
  params: Promise<{ id: string }>
}

export default function EditActualitePage({ params }: EditActualitePageProps) {
  const router = useRouter()
  const [articleId, setArticleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'club' as 'club' | 'tt' | 'handi',
    status: 'draft' as 'draft' | 'published',
    image_url: '',
  })

  useEffect(() => {
    params.then(({ id }) => {
      setArticleId(id)
      loadArticle(id)
    })
  }, [])

  const loadArticle = async (id: string) => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase.from('news').select('*').eq('id', id).single()
      if (error) throw error
      setFormData({
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content || '',
        category: data.category,
        status: data.status,
        image_url: data.image_url || '',
      })
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!articleId) return
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('news')
        .update({
          ...formData,
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)

      if (error) throw error
      setMessage({ type: 'success', text: 'Article mis à jour !' })
      setTimeout(() => router.push('/admin/actualites'), 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!articleId) return
    setDeleting(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.from('news').delete().eq('id', articleId)
      if (error) throw error
      router.push('/admin/actualites')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fas fa-edit mr-2 text-primary"></i>
            Modifier l&apos;article
          </h1>
          <p className="text-gray-600 mt-1">Modifiez et mettez à jour votre article</p>
        </div>
        <Link href="/admin/actualites" className="text-gray-600 hover:text-gray-900">
          <i className="fas fa-times text-2xl"></i>
        </Link>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <i className="fas fa-heading mr-1 text-primary"></i>
            Titre *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <i className="fas fa-tag mr-1 text-primary"></i>
              Catégorie
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'club', label: 'Club', icon: 'fa-home' },
                { value: 'tt', label: 'Tennis de Table', icon: 'fa-table-tennis-paddle-ball' },
                { value: 'handi', label: 'Handisport', icon: 'fa-wheelchair' },
              ].map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value as any })}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    formData.category === cat.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className={`fas ${cat.icon} text-lg mb-1 block`}></i>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <i className="fas fa-eye mr-1 text-primary"></i>
              Visibilité
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, status: 'draft' })}
                className={`p-3 rounded-lg text-center transition-colors ${
                  formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <i className="fas fa-pencil-alt text-lg mb-1 block"></i>
                <span className="text-sm font-medium">Brouillon</span>
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, status: 'published' })}
                className={`p-3 rounded-lg text-center transition-colors ${
                  formData.status === 'published' ? 'bg-green-100 text-green-800 border-2 border-green-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <i className="fas fa-globe text-lg mb-1 block"></i>
                <span className="text-sm font-medium">Publié</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            folder="articles"
            label="Image de couverture"
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <i className="fas fa-align-left mr-1 text-primary"></i>
            Résumé
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Une ou deux phrases qui résument l'article..."
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <i className="fas fa-file-alt mr-1 text-primary"></i>
            Contenu de l&apos;article *
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(html) => setFormData({ ...formData, content: html })}
            placeholder="Rédigez votre article ici..."
            storageFolder="articles"
          />
        </div>

        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-100 text-red-700 px-5 py-3 rounded-xl font-semibold hover:bg-red-200 transition-colors text-base"
          >
            <i className="fas fa-trash mr-2"></i>
            Supprimer
          </button>
          <div className="flex gap-3">
            <Link href="/admin/actualites" className="text-gray-600 hover:text-gray-900 font-semibold px-5 py-3 text-base">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors disabled:bg-gray-400"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>...</> : <><i className="fas fa-save mr-2"></i>Enregistrer</>}
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer "${formData.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        loading={deleting}
      />
    </div>
  )
}
