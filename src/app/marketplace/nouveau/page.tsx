'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

type ListingType = 'vente' | 'echange' | 'don'

export default function NouvelleAnnoncePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<ListingType>('vente')
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'bon',
  })

  if (!loading && !user) {
    router.push('/marketplace')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8]"></i>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('marketplace_listings').insert({
        title: form.title.trim(),
        description: form.description.trim(),
        type,
        price: type === 'vente' && form.price ? parseFloat(form.price) : null,
        condition: form.condition,
        images: [],
        status: 'active',
        user_id: user!.id,
      })
      if (err) throw err
      router.push('/marketplace')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication')
    } finally {
      setSubmitting(false)
    }
  }

  const types: { key: ListingType; label: string; icon: string; activeClass: string; iconClass: string }[] = [
    { key: 'vente', label: 'Vente', icon: 'fa-tag', activeClass: 'border-green-500 bg-green-500/10', iconClass: 'text-green-500' },
    { key: 'echange', label: 'Échange', icon: 'fa-exchange-alt', activeClass: 'border-blue-500 bg-blue-500/10', iconClass: 'text-blue-500' },
    { key: 'don', label: 'Don', icon: 'fa-gift', activeClass: 'border-purple-500 bg-purple-500/10', iconClass: 'text-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="container-custom">
          <Link
            href="/marketplace"
            className="text-[#3b9fd8] hover:text-[#2d8bc9] mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Retour à la marketplace
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-plus text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Nouvelle annonce</h1>
              <p className="text-gray-400">Proposez votre matériel à la communauté TLSTT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container-custom py-10">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Type */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Type d'annonce</h2>
              <div className="grid grid-cols-3 gap-3">
                {types.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      type === t.key ? t.activeClass : 'border-[#333] hover:border-[#555]'
                    }`}
                  >
                    <i className={`fas ${t.icon} text-2xl ${t.iconClass}`}></i>
                    <span className="font-semibold text-white text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Détails */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white">Détails de l'annonce</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] transition-colors"
                  placeholder="Ex : Raquette Butterfly Timo Boll ALC"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] resize-y transition-colors"
                  placeholder="Décrivez votre article, son état, les raisons de la vente..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">État</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#3b9fd8] transition-colors"
                >
                  <option value="neuf">Neuf (jamais utilisé)</option>
                  <option value="excellent">Très bon état</option>
                  <option value="bon">Bon état</option>
                  <option value="moyen">État moyen</option>
                </select>
              </div>

              {type === 'vente' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.50"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] transition-colors"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/marketplace"
                className="flex-1 py-3 border border-[#333] text-gray-400 rounded-xl font-semibold hover:bg-[#1a1a1a] transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#3b9fd8] text-white rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Publication...</>
                ) : (
                  <><i className="fas fa-check mr-2"></i>Publier l'annonce</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
