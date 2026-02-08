'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'

export default function NewCarouselSlidePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Récupérer la prochaine position
    const { data: slides } = await supabase
      .from('carousel_slides')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)

    const nextPos = slides && slides.length > 0 ? slides[0].position + 1 : 1

    const { error } = await supabase.from('carousel_slides').insert({
      ...formData,
      description: formData.subtitle,
      position: nextPos,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      setMessage({ type: 'success', text: 'Slide créé !' })
      setTimeout(() => router.push('/admin/carousel'), 1000)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fas fa-plus-circle mr-2 text-primary"></i>
            Nouveau Slide
          </h1>
          <p className="text-gray-600 mt-1">Ajoutez un slide au carrousel de la page d&apos;accueil</p>
        </div>
        <Link href="/admin/carousel" className="text-gray-600 hover:text-gray-900">
          <i className="fas fa-times text-2xl"></i>
        </Link>
      </div>

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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <i className="fas fa-heading mr-1 text-primary"></i>
                Titre *
              </label>
              <input type="text" required value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Ex: Bienvenue au TLSTT" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <i className="fas fa-comment mr-1 text-primary"></i>
                Sous-titre
              </label>
              <input type="text" value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Ex: Club de Tennis de Table" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            folder="carousel"
            label="Image de fond du slide"
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-sm font-bold text-gray-700 mb-4">
            <i className="fas fa-mouse-pointer mr-1 text-primary"></i>
            Bouton d&apos;action (optionnel)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Texte du bouton</label>
              <input type="text" value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Ex: Découvrir" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Lien du bouton</label>
              <input type="text" value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Ex: /club ou /contact" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-primary border-gray-300 rounded" />
            <span className="text-sm font-bold text-gray-700">Activer ce slide immédiatement</span>
          </label>
        </div>

        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow">
          <Link href="/admin/carousel" className="text-gray-600 hover:text-gray-900 font-semibold">
            <i className="fas fa-arrow-left mr-2"></i>Retour
          </Link>
          <button type="submit" disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:bg-gray-400">
            {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>...</> : <><i className="fas fa-save mr-2"></i>Créer le slide</>}
          </button>
        </div>
      </form>
    </div>
  )
}
