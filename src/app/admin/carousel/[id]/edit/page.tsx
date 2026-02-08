'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function EditCarouselSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [slideId, setSlideId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_link: '',
    position: 1,
    is_active: true,
  })

  useEffect(() => {
    params.then(({ id }) => {
      setSlideId(id)
      loadSlide(id)
    })
  }, [])

  const loadSlide = async (id: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('carousel_slides').select('*').eq('id', id).single()
    if (data) {
      setFormData({
        title: data.title || '',
        subtitle: data.subtitle || data.description || '',
        image_url: data.image_url || '',
        button_text: data.button_text || '',
        button_link: data.button_link || '',
        position: data.position || 1,
        is_active: data.is_active ?? true,
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('carousel_slides').update({
      ...formData,
      description: formData.subtitle,
    }).eq('id', slideId)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Slide mis à jour !' })
      setTimeout(() => router.push('/admin/carousel'), 1000)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('carousel_slides').delete().eq('id', slideId)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setDeleting(false)
      setShowDeleteModal(false)
    } else {
      router.push('/admin/carousel')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fas fa-edit mr-2 text-primary"></i>
            Modifier le Slide
          </h1>
        </div>
        <Link href="/admin/carousel" className="text-gray-600 hover:text-gray-900">
          <i className="fas fa-times text-2xl"></i>
        </Link>
      </div>

      {/* Preview */}
      {formData.image_url && (
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h3 className="font-bold text-gray-700 mb-3 text-sm">Prévisualisation</h3>
          <div className="relative h-48 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${formData.image_url})` }} />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{formData.title}</h2>
                <p className="text-white/80">{formData.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Titre *</label>
              <input type="text" required value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sous-titre</label>
              <input type="text" value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <ImageUpload value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })}
            folder="carousel" label="Image de fond" />
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Texte du bouton</label>
              <input type="text" value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ex: Découvrir" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Lien du bouton</label>
              <input type="text" value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ex: /contact" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-primary border-gray-300 rounded" />
            <span className="text-sm font-bold text-gray-700">Slide actif</span>
          </label>
          <div className="text-sm text-gray-500">Position : {formData.position}</div>
        </div>

        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow">
          <button type="button" onClick={() => setShowDeleteModal(true)}
            className="bg-red-100 text-red-700 px-5 py-3 rounded-xl font-semibold hover:bg-red-200">
            <i className="fas fa-trash mr-2"></i>Supprimer
          </button>
          <div className="flex gap-3">
            <Link href="/admin/carousel" className="text-gray-600 hover:text-gray-900 font-semibold px-5 py-3">Annuler</Link>
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:bg-gray-400">
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>...</> : <><i className="fas fa-save mr-2"></i>Enregistrer</>}
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal isOpen={showDeleteModal} onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)}
        title="Supprimer le slide" message="Êtes-vous sûr de vouloir supprimer ce slide du carrousel ?"
        confirmText="Supprimer" loading={deleting} />
    </div>
  )
}
