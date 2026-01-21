'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: string
  seller_id: string
  title: string
  description: string
  category: string
  condition: string
  price: number | null
  is_exchange: boolean
  is_gift: boolean
  images: string[] | null
  status: string
  created_at: string
  seller?: {
    first_name: string
    last_name: string
  }
}

const categories = [
  { key: '', label: 'Tout', icon: 'fa-th' },
  { key: 'raquette', label: 'Raquettes', icon: 'fa-table-tennis-paddle-ball' },
  { key: 'revetement', label: 'Revêtements', icon: 'fa-layer-group' },
  { key: 'textile', label: 'Textile', icon: 'fa-tshirt' },
  { key: 'chaussures', label: 'Chaussures', icon: 'fa-shoe-prints' },
  { key: 'robot', label: 'Robots', icon: 'fa-robot' },
  { key: 'table', label: 'Tables', icon: 'fa-table' },
  { key: 'autre', label: 'Autre', icon: 'fa-box' }
]

const conditions = {
  neuf: { label: 'Neuf', color: 'bg-green-500' },
  tres_bon: { label: 'Très bon', color: 'bg-blue-500' },
  bon: { label: 'Bon', color: 'bg-yellow-500' },
  correct: { label: 'Correct', color: 'bg-orange-500' },
  use: { label: 'Usé', color: 'bg-red-500' }
}

export default function MarketplacePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showNewListing, setShowNewListing] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/?login=true')
    }
  }, [loading, user, router])

  useEffect(() => {
    const fetchListings = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:member_profiles!seller_id(first_name, last_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      setListings(data || [])
      setIsLoading(false)
    }
    if (user) fetchListings()
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de]"></i>
      </div>
    )
  }

  const filteredListings = selectedCategory
    ? listings.filter(l => l.category === selectedCategory)
    : listings

  const myListings = listings.filter(l => l.seller_id === user.id)

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li><Link href="/espace-membre" className="hover:text-[#5bc0de]">Espace Membre</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Marketplace</li>
            </ol>
          </nav>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="text-[#5bc0de]">Marketplace</span> du Club
              </h1>
              <p className="text-white/70 text-lg">
                Échangez ou vendez votre matériel entre membres
              </p>
            </div>

            <button
              onClick={() => setShowNewListing(true)}
              className="bg-[#5bc0de] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4ab0ce] transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Publier une annonce
            </button>
          </div>

          {/* Catégories */}
          <div className="flex flex-wrap gap-2 mt-8">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-[#5bc0de] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className={`fas ${cat.icon} mr-2`}></i>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {/* Mes annonces */}
        {myListings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-user mr-2 text-[#5bc0de]"></i>
              Mes annonces ({myListings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {myListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} isOwner />
              ))}
            </div>
          </div>
        )}

        {/* Toutes les annonces */}
        <h2 className="text-xl font-bold text-white mb-4">
          <i className="fas fa-tags mr-2 text-[#5bc0de]"></i>
          {selectedCategory ? categories.find(c => c.key === selectedCategory)?.label : 'Toutes les annonces'}
          ({filteredListings.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
            <p className="text-white/60">Chargement des annonces...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white/10 rounded-2xl">
            <i className="fas fa-box-open text-6xl text-white/30 mb-4"></i>
            <h3 className="text-xl font-bold text-white/80 mb-2">Aucune annonce</h3>
            <p className="text-white/60">Soyez le premier à publier une annonce !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredListings.filter(l => l.seller_id !== user.id).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Modal nouvelle annonce */}
      {showNewListing && (
        <NewListingModal 
          onClose={() => setShowNewListing(false)} 
          onSuccess={() => {
            setShowNewListing(false)
            // Refresh listings
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

function ListingCard({ listing, isOwner = false }: { listing: Listing; isOwner?: boolean }) {
  const condition = conditions[listing.condition as keyof typeof conditions]

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-colors">
      <div className="aspect-square bg-white/5 relative">
        {listing.images?.[0] ? (
          <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-image text-4xl text-white/20"></i>
          </div>
        )}
        <span className={`absolute top-2 right-2 ${condition?.color || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded-full`}>
          {condition?.label || listing.condition}
        </span>
        {listing.is_gift && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            <i className="fas fa-gift mr-1"></i> Don
          </span>
        )}
        {listing.is_exchange && !listing.is_gift && (
          <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
            <i className="fas fa-exchange-alt mr-1"></i> Échange
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-white/50 mb-1">
          {categories.find(c => c.key === listing.category)?.label || listing.category}
        </div>
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{listing.title}</h3>
        <p className="text-white/60 text-sm mb-3 line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between">
          {listing.is_gift ? (
            <span className="text-xl font-bold text-green-400">Gratuit</span>
          ) : listing.price ? (
            <span className="text-xl font-bold text-[#5bc0de]">{listing.price}€</span>
          ) : (
            <span className="text-lg text-purple-400">À échanger</span>
          )}
          {isOwner ? (
            <span className="text-xs text-white/40">
              <i className="fas fa-eye mr-1"></i> Votre annonce
            </span>
          ) : (
            <button className="bg-[#5bc0de] text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#4ab0ce] transition-colors">
              <i className="fas fa-comment mr-1"></i> Contacter
            </button>
          )}
        </div>
        {listing.seller && !isOwner && (
          <div className="mt-3 pt-3 border-t border-white/10 text-white/50 text-xs">
            <i className="fas fa-user mr-1"></i>
            {listing.seller.first_name} {listing.seller.last_name?.[0]}.
          </div>
        )}
      </div>
    </div>
  )
}

function NewListingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'raquette',
    condition: 'bon',
    price: '',
    isExchange: false,
    isGift: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          price: formData.isGift ? null : (formData.price ? parseFloat(formData.price) : null),
          is_exchange: formData.isExchange,
          is_gift: formData.isGift,
          status: 'active'
        })

      if (insertError) throw insertError
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#0f3057]">
            <i className="fas fa-plus-circle mr-2 text-[#5bc0de]"></i>
            Nouvelle Annonce
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              placeholder="Ex: Bois Butterfly Viscaria"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent"
              placeholder="Décrivez votre article..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Catégorie</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de]"
              >
                {categories.slice(1).map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">État</label>
              <select
                value={formData.condition}
                onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de]"
              >
                {Object.entries(conditions).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Prix (€)</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              disabled={formData.isGift}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent disabled:bg-gray-100"
              placeholder="Ex: 50"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isExchange}
                onChange={e => setFormData(prev => ({ ...prev, isExchange: e.target.checked }))}
                className="w-4 h-4 text-[#5bc0de] rounded"
              />
              <span className="text-gray-700">Échange possible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGift}
                onChange={e => setFormData(prev => ({ ...prev, isGift: e.target.checked, price: e.target.checked ? '' : prev.price }))}
                className="w-4 h-4 text-[#5bc0de] rounded"
              />
              <span className="text-gray-700">Don gratuit</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5bc0de] text-white py-3 rounded-lg font-semibold hover:bg-[#4ab0ce] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Publication...</>
            ) : (
              <><i className="fas fa-check mr-2"></i>Publier l'annonce</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
