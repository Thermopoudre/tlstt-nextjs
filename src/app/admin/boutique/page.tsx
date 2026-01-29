'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  image_url: string | null
  category: string
  active: boolean
}

export default function AdminBoutiquePage() {
  const supabase = createClientComponentClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'out_of_stock'>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('shop_products')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setProducts(data)
    setLoading(false)
  }

  const toggleActive = async (id: number, active: boolean) => {
    await supabase
      .from('shop_products')
      .update({ active: !active })
      .eq('id', id)
    fetchProducts()
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'active') return p.active
    if (filter === 'out_of_stock') return p.stock === 0
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Boutique</h1>
          <p className="text-gray-600 mt-1">Gérez les produits de la boutique du club</p>
        </div>
        <Link href="/admin/boutique/nouveau" className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>
          Nouveau produit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Total produits</p>
          <p className="text-2xl font-bold text-primary">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Actifs</p>
          <p className="text-2xl font-bold text-green-600">{products.filter(p => p.active).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Rupture de stock</p>
          <p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock === 0).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Stock faible (&lt;5)</p>
          <p className="text-2xl font-bold text-yellow-600">{products.filter(p => p.stock > 0 && p.stock < 5).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'out_of_stock'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Rupture'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          <Link href="/admin/boutique/nouveau" className="btn-primary mt-4 inline-flex items-center gap-2">
            <i className="fas fa-plus"></i>
            Ajouter un produit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <i className="fas fa-image text-4xl"></i>
                  </div>
                )}
                {!product.active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Inactif</span>
                  </div>
                )}
                {product.stock === 0 && product.active && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Rupture</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{product.name}</h3>
                  <span className="text-lg font-bold text-primary">{product.price}€</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-gray-500">Stock:</span>
                    <span className={`font-medium ml-1 ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock < 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(product.id, product.active)}
                      className={`p-2 rounded-lg transition-colors ${
                        product.active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={product.active ? 'Désactiver' : 'Activer'}
                    >
                      <i className={`fas ${product.active ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                    <Link
                      href={`/admin/boutique/${product.id}`}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
