'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewAlbumPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'competition' as 'competition' | 'entrainement' | 'evenement' | 'autre',
    is_published: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('albums')
        .insert([formData])
        .select()
        .single()

      if (error) throw error

      setMessage({ type: 'success', text: 'Album créé avec succès !' })
      
      setTimeout(() => {
        router.push('/admin/galerie')
      }, 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la création' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvel album</h1>
          <p className="text-gray-600 mt-1">Créez un nouvel album photo</p>
        </div>
        <Link href="/admin/galerie" className="text-gray-600 hover:text-gray-900">
          <i className="fas fa-times text-2xl"></i>
        </Link>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre de l'album *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: Championnat Régional 2026"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'événement *
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="competition">Compétition</option>
              <option value="entrainement">Entraînement</option>
              <option value="evenement">Événement</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de l'événement *
            </label>
            <input
              type="date"
              required
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Description de l'événement..."
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Publier l'album</span>
              <p className="text-xs text-gray-500">L'album sera visible sur le site</p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
          <Link href="/admin/galerie" className="text-gray-600 hover:text-gray-900 font-semibold">
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
                Création...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Créer l'album
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
