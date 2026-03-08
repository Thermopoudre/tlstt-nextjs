'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ImageUpload from '@/components/admin/ImageUpload'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

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
    meta_title: '',
    meta_description: '',
  })
  const [showSeo, setShowSeo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content || formData.content === '<p></p>') {
      setMessage({ type: 'error', text: 'Le contenu de l\'article est obligatoire' })
      return
    }

    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { data: newArticle, error } = await supabase
        .from('news')
        .insert([{
          ...formData,
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
        }])
        .select()
        .single()

      if (error) throw error

      // Auto-ping moteurs de recherche si publié
      if (formData.status === 'published' && newArticle) {
        fetch('/api/seo/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `/actualites/${formData.category}/${newArticle.id}`,
            type: 'article',
          }),
        }).catch(() => {}) // fire-and-forget
      }

      setMessage({ type: 'success', text: 'Article créé avec succès !' })
      setTimeout(() => router.push('/admin/actualites'), 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la création' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fas fa-plus-circle mr-2 text-primary"></i>
            Nouvel article
          </h1>
          <p className="text-gray-600 mt-1">Rédigez un nouvel article pour votre site</p>
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
        {/* Titre - gros et visible */}
        <div className="bg-white p-6 rounded-xl shadow">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <i className="fas fa-heading mr-1 text-primary"></i>
            Titre de l&apos;article *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: Victoire de l'équipe 1 au championnat"
          />
        </div>

        {/* Catégorie + Statut côte à côte */}
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
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'draft' })}
                className={`p-3 rounded-lg text-center transition-colors ${
                  formData.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-pencil-alt text-lg mb-1 block"></i>
                <span className="text-sm font-medium">Brouillon</span>
                <p className="text-xs mt-0.5 opacity-70">Non visible sur le site</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'published' })}
                className={`p-3 rounded-lg text-center transition-colors ${
                  formData.status === 'published'
                    ? 'bg-green-100 text-green-800 border-2 border-green-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-globe text-lg mb-1 block"></i>
                <span className="text-sm font-medium">Publié</span>
                <p className="text-xs mt-0.5 opacity-70">Visible par tous</p>
              </button>
            </div>
          </div>
        </div>

        {/* Image - avec upload */}
        <div className="bg-white p-6 rounded-xl shadow">
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            folder="articles"
            label="Image de couverture"
          />
        </div>

        {/* Extrait */}
        <div className="bg-white p-6 rounded-xl shadow">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <i className="fas fa-align-left mr-1 text-primary"></i>
            Résumé
            <span className="font-normal text-gray-400 ml-2">(apparaît dans la liste des articles)</span>
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Une ou deux phrases qui résument l'article..."
          />
        </div>

        {/* Contenu riche */}
        <div className="bg-white p-6 rounded-xl shadow">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <i className="fas fa-file-alt mr-1 text-primary"></i>
            Contenu de l&apos;article *
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(html) => setFormData({ ...formData, content: html })}
            placeholder="Commencez à rédiger votre article ici... Utilisez la barre d'outils ci-dessus pour mettre en forme."
            storageFolder="articles"
          />
        </div>

        {/* SEO - Section pliable */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div>
              <span className="text-sm font-bold text-gray-700">
                <i className="fas fa-search mr-1 text-green-600"></i>
                SEO - Référencement
              </span>
              <p className="text-xs text-gray-400 mt-0.5">Personnalisez le titre et la description pour Google (optionnel, auto-généré sinon)</p>
            </div>
            <i className={`fas fa-chevron-${showSeo ? 'up' : 'down'} text-gray-400`}></i>
          </button>
          {showSeo && (
            <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre SEO <span className="text-gray-400 font-normal">(max 60 caractères)</span>
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={formData.title || 'Auto-généré depuis le titre'}
                />
                <p className="text-xs text-gray-400 mt-1">{formData.meta_title.length}/60 — Laissez vide pour utiliser le titre de l&apos;article</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description SEO <span className="text-gray-400 font-normal">(max 155 caractères)</span>
                </label>
                <textarea
                  maxLength={155}
                  rows={2}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={formData.excerpt || 'Auto-généré depuis le résumé ou le contenu'}
                />
                <p className="text-xs text-gray-400 mt-1">{formData.meta_description.length}/155 — Laissez vide pour auto-génération</p>
              </div>

              {/* Aperçu Google */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-xs text-gray-500 mb-2 font-semibold">
                  <i className="fab fa-google mr-1"></i>
                  Aperçu Google
                </p>
                <div className="font-sans">
                  <p className="text-[#1a0dab] text-lg leading-tight truncate">
                    {formData.meta_title || formData.title || 'Titre de l\'article'} | TLSTT
                  </p>
                  <p className="text-green-700 text-sm">tlstt-nextjs.vercel.app &rsaquo; actualites &rsaquo; {formData.category}</p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {formData.meta_description || formData.excerpt || 'La description sera auto-générée depuis le contenu de l\'article...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow">
          <Link href="/admin/actualites" className="text-gray-600 hover:text-gray-900 font-semibold text-base">
            <i className="fas fa-arrow-left mr-2"></i>
            Retour
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors disabled:bg-gray-400"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement...</>
            ) : (
              <><i className="fas fa-save mr-2"></i>Enregistrer l&apos;article</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
