'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EditActualitePageProps {
  params: Promise<{ id: string }>
}

export default function EditActualitePage({ params }: EditActualitePageProps) {
  const router = useRouter()
  const [articleId, setArticleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setFormData({
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content,
        category: data.category,
        status: data.status,
        image_url: data.image_url || '',
      })
    } catch (error: any) {
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

      setMessage({ type: 'success', text: 'Actualité mise à jour avec succès !' })
      
      setTimeout(() => {
        router.push('/admin/actualites')
      }, 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!articleId) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return

    setDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      router.push('/admin/actualites')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la suppression' })
      setDeleting(false)
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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier l'actualité</h1>
          <p className="text-gray-600 mt-1">Éditez votre actualité</p>
        </div>
        <Link
          href="/admin/actualites"
          className="text-gray-600 hover:text-gray-900"
        >
          <i className="fas fa-times text-2xl"></i>
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre de l'actualité *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Catégorie et Statut */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="club">Actualités Club</option>
              <option value="tt">Actualités Tennis de Table</option>
              <option value="handi">Handisport</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
        </div>

        {/* Extrait */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Extrait / Résumé
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Image */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL de l'image
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Contenu */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenu de l'article *
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={15}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
          >
            {deleting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Suppression...
              </>
            ) : (
              <>
                <i className="fas fa-trash mr-2"></i>
                Supprimer
              </>
            )}
          </button>
          <div className="flex gap-3">
            <Link
              href="/admin/actualites"
              className="text-gray-600 hover:text-gray-900 font-semibold px-6 py-3"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:bg-gray-400"
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
