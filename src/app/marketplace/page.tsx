'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Listing {
  id: string
  title: string
  description: string
  price: number | null
  condition: string
  type: 'vente' | 'echange' | 'don'
  images: string[]
  created_at: string
  seller: {
    first_name: string
    last_name: string
  }
}

export default function MarketplacePage() {
  const { user, loading } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    const fetchListings = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:profiles(first_name, last_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      setListings(data || [])
      setIsLoading(false)
    }
    if (user) fetchListings()
    else setIsLoading(false)
  }, [user])

  // Page pour visiteurs non connectés
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-[#0f3057] py-12">
          <div className="max-w-7xl mx-auto px-5">
            <Breadcrumbs className="text-gray-400 mb-6" />
            <div className="flex items-center gap-4">
              <i className="fas fa-handshake text-4xl text-[#5bc0de]"></i>
              <div>
                <h1 className="text-3xl font-bold text-white">Marketplace</h1>
                <p className="text-gray-300">Achetez, vendez, échangez entre membres</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-[#5bc0de]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-users text-4xl text-[#5bc0de]"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Espace Membres Uniquement</h2>
            <p className="text-gray-600 mb-8">
              La marketplace est réservée aux membres du club. 
              C'est l'endroit idéal pour vendre votre matériel d'occasion, 
              échanger des articles ou faire des dons entre pongistes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/espace-membre"
                className="px-8 py-3 bg-[#5bc0de] text-white rounded-xl font-semibold hover:bg-[#4ab0ce] transition-colors"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Se connecter
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border-2 border-[#0f3057] text-[#0f3057] rounded-xl font-semibold hover:bg-[#0f3057] hover:text-white transition-colors"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Devenir membre
              </Link>
            </div>
          </div>

          {/* Explication */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-tag text-2xl text-green-600"></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Vente</h3>
              <p className="text-sm text-gray-600">Vendez votre matériel à prix membre</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exchange-alt text-2xl text-blue-600"></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Échange</h3>
              <p className="text-sm text-gray-600">Échangez raquettes et équipements</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-gift text-2xl text-purple-600"></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Don</h3>
              <p className="text-sm text-gray-600">Donnez aux nouveaux joueurs</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    )
  }

  const types = [
    { key: '', label: 'Tout', icon: 'fa-th', color: 'bg-gray-500' },
    { key: 'vente', label: 'Vente', icon: 'fa-tag', color: 'bg-green-500' },
    { key: 'echange', label: 'Échange', icon: 'fa-exchange-alt', color: 'bg-blue-500' },
    { key: 'don', label: 'Don', icon: 'fa-gift', color: 'bg-purple-500' }
  ]

  const filteredListings = filter
    ? listings.filter(l => l.type === filter)
    : listings

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero */}
      <div className="bg-[#0f3057] py-12">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-400 mb-6" />
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <i className="fas fa-handshake text-[#5bc0de] mr-3"></i>
                Marketplace
              </h1>
              <p className="text-white/70">Achetez, vendez, échangez entre membres du club</p>
            </div>
            <Link
              href="/marketplace/nouveau"
              className="bg-[#5bc0de] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4ab0ce] transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Nouvelle annonce
            </Link>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mt-8">
            {types.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  filter === t.key
                    ? `${t.color} text-white`
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className={`fas ${t.icon} mr-2`}></i>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
            <p className="text-gray-500">Chargement des annonces...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune annonce</h3>
            <p className="text-gray-500 mb-6">Soyez le premier à publier une annonce !</p>
            <Link
              href="/marketplace/nouveau"
              className="inline-block bg-[#5bc0de] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4ab0ce] transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Créer une annonce
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {listing.images?.[0] ? (
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-table-tennis-paddle-ball text-4xl text-gray-300"></i>
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-white text-sm font-medium ${
                    listing.type === 'vente' ? 'bg-green-500' :
                    listing.type === 'echange' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {listing.type === 'vente' ? 'Vente' :
                     listing.type === 'echange' ? 'Échange' : 'Don'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    {listing.type === 'vente' && listing.price ? (
                      <span className="text-2xl font-bold text-[#5bc0de]">{listing.price}€</span>
                    ) : listing.type === 'don' ? (
                      <span className="text-lg font-bold text-purple-600">Gratuit</span>
                    ) : (
                      <span className="text-lg font-bold text-blue-600">À échanger</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    <i className="fas fa-user mr-1"></i>
                    {listing.seller?.first_name} {listing.seller?.last_name?.[0]}.
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
