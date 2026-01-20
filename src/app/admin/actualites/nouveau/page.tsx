'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewActualitePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'club' as 'club' | 'tt' | 'handi',
    status: 'draft' as 'draft' | 'published',
    image_url: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('news')
        .insert([{
          ...formData,
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
        }])
        .select()
        .single()

      if (error) throw error

      setMessage({ type: 'success', text: 'Actualité créée avec succès !' })
      
      // Rediriger après 1 seconde
      setTimeout(() => {
        router.push('/admin/actualites')
      }, 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la création' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle actualité</h1>
          <p className="text-gray-600 mt-1">Créez une nouvelle actualité pour votre site</p>
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
            placeholder="Ex: Victoire de l'équipe 1"
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
            placeholder="Courte description qui apparaîtra dans la liste des actualités"
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
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-sm text-gray-500 mt-2">
            <i className="fas fa-info-circle mr-1"></i>
            Collez l'URL d'une image hébergée en ligne
          </p>
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
            placeholder="Contenu HTML de votre actualité..."
          />
          <p className="text-sm text-gray-500 mt-2">
            <i className="fas fa-code mr-1"></i>
            Vous pouvez utiliser du HTML pour formatter votre contenu
          </p>
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <strong>Exemples de HTML :</strong><br />
            <code className="bg-white px-2 py-1 rounded">&lt;h2&gt;Titre&lt;/h2&gt;</code><br />
            <code className="bg-white px-2 py-1 rounded">&lt;p&gt;Paragraphe&lt;/p&gt;</code><br />
            <code className="bg-white px-2 py-1 rounded">&lt;strong&gt;Gras&lt;/strong&gt;</code><br />
            <code className="bg-white px-2 py-1 rounded">&lt;ul&gt;&lt;li&gt;Liste&lt;/li&gt;&lt;/ul&gt;</code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
          <Link
            href="/admin/actualites"
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:bg-gray-400"
          >
            {loading ? (
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
      </form>
    </div>
  )
}
