'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTrainingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '18:00',
    end_time: '20:00',
    activity_name: '',
    activity_type: 'dirige' as any,
    level: '',
    age_range: '',
    description: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      await supabase.from('trainings').insert([formData])
      router.push('/admin/planning')
    } catch (error) {
      alert('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nouveau créneau</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium mb-2">Nom de l'activité *</label>
          <input
            type="text"
            required
            value={formData.activity_name}
            onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Ex: Entraînement Jeunes"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium mb-2">Jour *</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value={1}>Lundi</option>
              <option value={2}>Mardi</option>
              <option value={3}>Mercredi</option>
              <option value={4}>Jeudi</option>
              <option value={5}>Vendredi</option>
              <option value={6}>Samedi</option>
              <option value={7}>Dimanche</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium mb-2">Début *</label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium mb-2">Fin *</label>
            <input
              type="time"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium mb-2">Type *</label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="jeunes">Jeunes</option>
              <option value="dirige">Dirigé</option>
              <option value="libre">Libre</option>
              <option value="loisirs">Loisirs</option>
              <option value="individuel">Individuel</option>
              <option value="competition">Compétition</option>
              <option value="handisport">Handisport</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium mb-2">Niveau</label>
            <input
              type="text"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Ex: Tous niveaux"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium mb-2">Tranche d'âge</label>
          <input
            type="text"
            value={formData.age_range}
            onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Ex: 10-14 ans"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
          <Link href="/admin/planning" className="text-gray-600 hover:text-gray-900">Annuler</Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light"
          >
            {loading ? 'Création...' : 'Créer le créneau'}
          </button>
        </div>
      </form>
    </div>
  )
}
