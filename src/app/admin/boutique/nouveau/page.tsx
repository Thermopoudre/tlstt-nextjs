'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ImageUpload from '@/components/admin/ImageUpload'

export default function NouveauProduitPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'textile',
    stock: 0,
    sizes: '',
    image_url: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const sizesArray = form.sizes
      ? form.sizes.split(',').map(s => s.trim()).filter(Boolean)
      : null

    const { error: dbError } = await supabase.from('shop_products').insert({
      name: form.name,
      description: form.description,
      price: form.price,
      category: form.category,
      stock: form.stock,
      sizes: sizesArray,
      image_url: form.image_url || null,
      is_active: form.is_active,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/admin/boutique')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/boutique" className="p-2 hover:bg-gray-100 rounded-lg">
          <i className="fas fa-arrow-left text-gray-600"></i>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Nouveau produit</h1>
          <p className="text-gray-600 mt-1">Ajoutez un produit a la boutique</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i>{error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du produit *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="ex: Maillot TLSTT" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categorie *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="textile">Textile</option>
                <option value="accessories">Accessoires</option>
                <option value="equipment">Equipement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4} placeholder="Description detaillee du produit..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (EUR) *</label>
              <input type="number" required min="0" step="0.01" value={form.price}
                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
              <input type="number" required min="0" value={form.stock}
                onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tailles</label>
              <input type="text" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="S, M, L, XL (separees par virgule)" />
            </div>
          </div>

          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            folder="boutique"
            label="Image du produit"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
              className="w-5 h-5 rounded text-primary" />
            <span className="text-sm font-semibold text-gray-700">Produit actif (visible dans la boutique)</span>
          </label>

          <div className="flex gap-4 pt-4 border-t">
            <Link href="/admin/boutique"
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 text-center hover:bg-gray-50">
              Annuler
            </Link>
            <button type="submit" disabled={saving}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement...</> : <><i className="fas fa-save mr-2"></i>Creer le produit</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
