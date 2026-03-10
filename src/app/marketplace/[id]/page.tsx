'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface ListingDetail {
  id: string
  title: string
  description: string
  price: number | null
  condition: string
  type: 'vente' | 'echange' | 'don'
  images: string[]
  status: string
  created_at: string
  user_id: string
  seller: {
    first_name: string | null
    last_name: string | null
  } | null
}

const conditionLabels: Record<string, string> = {
  neuf: 'Neuf (jamais utilisé)',
  excellent: 'Très bon état',
  bon: 'Bon état',
  moyen: 'État moyen',
}

const typeConfig = {
  vente: { label: 'Vente', color: 'bg-green-500', icon: 'fa-tag' },
  echange: { label: 'Échange', color: 'bg-blue-500', icon: 'fa-exchange-alt' },
  don: { label: 'Don', color: 'bg-purple-500', icon: 'fa-gift' },
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [contactSent, setContactSent] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  // Vérification accès membre validé
  const isMemberValidated =
    profile?.role === 'admin' ||
    profile?.role === 'member' ||
    profile?.is_validated === true

  useEffect(() => {
    if (!id) return
    const fetchListing = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:profiles(first_name, last_name)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setListing(data as ListingDetail)
        if (user && data.user_id === user.id) {
          setIsOwner(true)
        }
      }
      setIsLoading(false)
    }
    fetchListing()
  }, [id, user])

  // Redirect si non connecté
  if (!loading && !user) {
    router.push('/marketplace')
    return null
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8]"></i>
      </div>
    )
  }

  // Membre connecté mais non validé
  if (!isMemberValidated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
          <div className="container-custom">
            <Breadcrumbs className="text-gray-500 mb-6" />
            <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-id-badge text-4xl text-yellow-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Réservé aux membres du club</h2>
            <p className="text-gray-400 mb-6">
              La marketplace est exclusivement réservée aux membres licenciés du TLSTT.
              Votre compte doit être validé par le secrétariat pour accéder à cet espace.
            </p>
            <Link
              href="/espace-membre"
              className="px-8 py-3 bg-[#3b9fd8] text-white rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors inline-block"
            >
              <i className="fas fa-user mr-2"></i>
              Mon espace membre
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
          <div className="container-custom">
            <Breadcrumbs className="text-gray-500 mb-6" />
          </div>
        </div>
        <div className="container-custom py-16 text-center">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 max-w-lg mx-auto">
            <i className="fas fa-search text-6xl text-gray-600 mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-3">Annonce introuvable</h2>
            <p className="text-gray-500 mb-6">
              Cette annonce n&apos;existe pas ou a été supprimée.
            </p>
            <Link
              href="/marketplace"
              className="inline-block bg-[#3b9fd8] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour à la marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const typeInfo = typeConfig[listing.type]

  const handleContact = async () => {
    if (!user || !listing) return
    setContactLoading(true)
    setContactError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('marketplace_messages').insert({
        listing_id: listing.id,
        sender_id: user.id,
        receiver_id: listing.user_id,
        message: `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}". Pouvez-vous me recontacter ?`,
        read: false,
      })
      if (error) throw error
      setContactSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi'
      setContactError(message)
    } finally {
      setContactLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isOwner || !listing) return
    if (!confirm('Supprimer cette annonce ?')) return
    const supabase = createClient()
    await supabase
      .from('marketplace_listings')
      .update({ status: 'deleted' })
      .eq('id', listing.id)
    router.push('/marketplace')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs
            items={[
              { label: 'Marketplace', href: '/marketplace' },
              { label: listing.title },
            ]}
            className="text-gray-500 mb-6"
          />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${typeInfo.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <i className={`fas ${typeInfo.icon} text-2xl text-white`}></i>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{listing.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {conditionLabels[listing.condition] || listing.condition}
                  </span>
                </div>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                <i className="fas fa-trash mr-2"></i>
                Retirer l&apos;annonce
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">

            {/* Galerie d'images */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
              <div className="aspect-video bg-[#111] relative">
                {listing.images?.length > 0 ? (
                  <Image
                    src={listing.images[activeImage]}
                    alt={listing.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <i className="fas fa-table-tennis-paddle-ball text-6xl mb-3"></i>
                    <p className="text-sm">Pas d&apos;image</p>
                  </div>
                )}
              </div>
              {/* Miniatures */}
              {listing.images?.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImage === idx ? 'border-[#3b9fd8]' : 'border-[#333] hover:border-[#555]'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${listing.title} - photo ${idx + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-align-left mr-2 text-[#3b9fd8]"></i>
                Description
              </h2>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Détails */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-info-circle mr-2 text-[#3b9fd8]"></i>
                Détails
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Type</dt>
                  <dd className={`font-semibold text-white`}>{typeInfo.label}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">État</dt>
                  <dd className="text-white">{conditionLabels[listing.condition] || listing.condition}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Publié le</dt>
                  <dd className="text-white">
                    {new Date(listing.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prix / Action */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 sticky top-6">
              {listing.type === 'vente' && listing.price !== null ? (
                <div className="text-4xl font-bold text-[#3b9fd8] mb-4">
                  {listing.price.toFixed(2)} €
                </div>
              ) : listing.type === 'don' ? (
                <div className="text-3xl font-bold text-purple-400 mb-4">Gratuit</div>
              ) : (
                <div className="text-2xl font-bold text-blue-400 mb-4">Échange</div>
              )}

              {!isOwner ? (
                <div className="space-y-3">
                  {contactSent ? (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-center">
                      <i className="fas fa-check-circle mr-2"></i>
                      Message envoyé ! Le vendeur vous recontactera.
                    </div>
                  ) : (
                    <>
                      {contactError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                          <i className="fas fa-exclamation-circle mr-2"></i>
                          {contactError}
                        </div>
                      )}
                      <button
                        onClick={handleContact}
                        disabled={contactLoading}
                        className="w-full bg-[#3b9fd8] text-white py-3 rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50"
                      >
                        {contactLoading ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>Envoi...</>
                        ) : (
                          <><i className="fas fa-envelope mr-2"></i>Contacter le vendeur</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-center text-gray-400 text-sm">
                  <i className="fas fa-user mr-2"></i>
                  Votre annonce
                </div>
              )}

              {/* Vendeur */}
              <div className="mt-6 pt-6 border-t border-[#333]">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Vendeur</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3b9fd8]/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-[#3b9fd8]"></i>
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {listing.seller?.first_name}{' '}
                      {listing.seller?.last_name?.[0] ? `${listing.seller.last_name[0]}.` : ''}
                    </div>
                    <div className="text-gray-500 text-xs">Membre TLSTT</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Retour */}
            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 w-full py-3 border border-[#333] text-gray-400 rounded-xl font-semibold hover:bg-[#1a1a1a] transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Retour à la marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
