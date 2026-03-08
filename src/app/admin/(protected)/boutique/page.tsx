'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  category: string | null
  sizes: string[] | null
  is_active: boolean
}

export default function AdminBoutiquePage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'out_of_stock'>('all')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', price: 0, stock: 0,
    image_url: '', category: 'textile', sizes: '', is_active: true,
  })

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    const { data } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('shop_products').update({ is_active: !isActive }).eq('id', id)
    fetchProducts()
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    await supabase.from('shop_products').delete().eq('id', id)
    fetchProducts()
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name, description: p.description || '', price: p.price,
      stock: p.stock, image_url: p.image_url || '', category: p.category || 'textile',
      sizes: p.sizes?.join(', ') || '', is_active: p.is_active,
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProduct) return
    setSaving(true)
    const sizesArray = form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : null
    await supabase.from('shop_products').update({
      name: form.name, description: form.description || null, price: form.price,
      stock: form.stock, image_url: form.image_url || null, category: form.category,
      sizes: sizesArray, is_active: form.is_active,
    }).eq('id', editProduct.id)
    setSaving(false)
    setEditProduct(null)
    fetchProducts()
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'active') return p.is_active
    if (filter === 'out_of_stock') return p.stock === 0
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Boutique</h1>
          <p className="text-gray-600 mt-1">Gerez les produits de la boutique</p>
        </div>
        <Link href="/admin/boutique/nouveau" className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouveau produit
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-primary">{products.length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Actifs</p><p className="text-2xl font-bold text-green-600">{products.filter(p => p.is_active).length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Rupture</p><p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock === 0).length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Stock faible</p><p className="text-2xl font-bold text-yellow-600">{products.filter(p => p.stock > 0 && p.stock < 5).length}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'out_of_stock'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Rupture'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Aucun produit trouve</p>
          <Link href="/admin/boutique/nouveau" className="btn-primary mt-4 inline-flex items-center gap-2"><i className="fas fa-plus"></i>Ajouter</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden group">
              <div className="aspect-video bg-gray-100 relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><i className="fas fa-image text-4xl"></i></div>
                )}
                {!product.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Inactif</span>
                  </div>
                )}
                {product.stock === 0 && product.is_active && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">Rupture</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{product.name}</h3>
                  <span className="text-lg font-bold text-primary">{product.price}€</span>
                </div>
                {product.description && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.sizes.map(s => <span key={s} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{s}</span>)}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm">Stock: <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>{product.stock}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive(product.id, product.is_active)} className={`p-2 rounded-lg ${product.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={product.is_active ? 'Desactiver' : 'Activer'}>
                      <i className={`fas ${product.is_active ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                    <button onClick={() => openEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => deleteProduct(product.id, product.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {editProduct && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setEditProduct(null)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Modifier : {editProduct.name}</h2>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Prix (€)</label>
                    <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
                    <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Categorie</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="textile">Textile</option>
                      <option value="accessories">Accessoires</option>
                      <option value="equipment">Equipement</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tailles (separees par virgules)</label>
                  <input type="text" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="S, M, L, XL" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                  <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-sm font-semibold text-gray-700">Actif</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditProduct(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>...</> : <><i className="fas fa-save mr-2"></i>Enregistrer</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
