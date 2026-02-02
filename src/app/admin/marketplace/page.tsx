'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: number
  title: string
  description: string
  price: number
  type: 'vente' | 'echange' | 'don'
  condition: string
  category: string
  seller_name: string
  seller_email: string
  status: 'pending' | 'approved' | 'rejected' | 'sold'
  created_at: string
  image_url: string | null
}

export default function AdminMarketplacePage() {
  const supabase = createClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    const { data } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false })
    if (data) setListings(data)
    setLoading(false)
  }

  const updateStatus = async (id: number, status: string) => {
    await supabase.from('marketplace_listings').update({ status }).eq('id', id)
    fetchListings()
  }

  const filteredListings = listings.filter(l => {
    if (filter === 'pending') return l.status === 'pending'
    if (filter === 'approved') return l.status === 'approved'
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En attente</span>
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approuvé</span>
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Refusé</span>
      case 'sold': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Vendu</span>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Marketplace</h1>
          <p className="text-gray-600 mt-1">Modération des annonces entre membres</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-primary">{listings.length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">En attente</p><p className="text-2xl font-bold text-yellow-600">{listings.filter(l => l.status === 'pending').length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Approuvées</p><p className="text-2xl font-bold text-green-600">{listings.filter(l => l.status === 'approved').length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Vendues</p><p className="text-2xl font-bold text-blue-600">{listings.filter(l => l.status === 'sold').length}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2">
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvées' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center"><i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i><p className="text-gray-500 text-lg">{filter === 'pending' ? 'Aucune annonce en attente' : 'Aucune annonce'}</p></div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-48 h-48 md:h-auto bg-gray-100 flex-shrink-0">
                  {listing.image_url ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><i className="fas fa-image text-4xl"></i></div>}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{listing.title}</h3>
                      <p className="text-sm text-gray-500">Par {listing.seller_name} • {new Date(listing.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(listing.status)}
                      <span className="text-xl font-bold text-primary">{listing.type === 'don' ? 'Gratuit' : `${listing.price}€`}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{listing.category}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{listing.condition}</span>
                    </div>
                    {listing.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(listing.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><i className="fas fa-check mr-2"></i>Approuver</button>
                        <button onClick={() => updateStatus(listing.id, 'rejected')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"><i className="fas fa-times mr-2"></i>Refuser</button>
                      </div>
                    )}
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
