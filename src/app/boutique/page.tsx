'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
  sizes: string[] | null
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
  size?: string
}

export default function BoutiquePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [helloassoUrl, setHelloassoUrl] = useState<string>('')
  const [helloassoCotisationUrl, setHelloassoCotisationUrl] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Charger les produits
      const { data } = await supabase
        .from('shop_products')
        .select('*')
        .eq('is_active', true)
        .order('category')
      setProducts(data || [])
      
      // Charger les URLs HelloAsso
      const { data: settings } = await supabase
        .from('settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['helloasso_boutique_url', 'helloasso_cotisation_url'])
      
      if (settings) {
        const boutUrl = settings.find(s => s.setting_key === 'helloasso_boutique_url')?.setting_value
        const cotUrl = settings.find(s => s.setting_key === 'helloasso_cotisation_url')?.setting_value
        if (boutUrl) setHelloassoUrl(boutUrl)
        if (cotUrl) setHelloassoCotisationUrl(cotUrl)
      }
      
      setIsLoading(false)
    }
    if (user) fetchData()
    else setIsLoading(false)
  }, [user])

  // Membre connecte mais pas encore valide
  const isMemberValidated = profile?.role === 'admin' || profile?.role === 'member' || profile?.is_validated === true

  // Page pour visiteurs non connectes
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
          <div className="max-w-7xl mx-auto px-5">
            <Breadcrumbs className="text-gray-500 mb-6" />
            <div className="flex items-center gap-4">
              <i className="fas fa-store text-4xl text-[#3b9fd8]"></i>
              <div>
                <h1 className="text-3xl font-bold text-white">Boutique du Club</h1>
                <p className="text-gray-400">Articles officiels TLSTT</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-[#3b9fd8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-lock text-4xl text-[#3b9fd8]"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Accès Réservé aux Membres</h2>
            <p className="text-gray-400 mb-8">
              La boutique du club est réservée aux membres licenciés du TLSTT.
              Connectez-vous pour accéder aux articles officiels du club.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/espace-membre"
                className="px-8 py-3 bg-[#3b9fd8] text-white rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Se connecter
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border-2 border-[#3b9fd8] text-[#3b9fd8] rounded-xl font-semibold hover:bg-[#3b9fd8] hover:text-white transition-colors"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Devenir membre
              </Link>
            </div>
          </div>

          {/* Aperçu produits */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              <i className="fas fa-eye mr-2 text-[#3b9fd8]"></i>
              Aperçu de la boutique
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
                <i className="fas fa-tshirt text-3xl text-[#3b9fd8] mb-2"></i>
                <p className="text-sm text-gray-400">Maillots</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
                <i className="fas fa-bag-shopping text-3xl text-[#3b9fd8] mb-2"></i>
                <p className="text-sm text-gray-400">Accessoires</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
                <i className="fas fa-table-tennis-paddle-ball text-3xl text-[#3b9fd8] mb-2"></i>
                <p className="text-sm text-gray-400">Équipement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Membre en attente de validation
  if (!loading && user && !isMemberValidated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
          <div className="max-w-7xl mx-auto px-5">
            <Breadcrumbs className="text-gray-500 mb-6" />
            <div className="flex items-center gap-4">
              <i className="fas fa-store text-4xl text-[#3b9fd8]"></i>
              <div>
                <h1 className="text-3xl font-bold text-white">Boutique du Club</h1>
                <p className="text-gray-400">Articles officiels TLSTT</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-hourglass-half text-4xl text-yellow-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Validation en attente</h2>
            <p className="text-gray-400 mb-6">
              Votre compte est en attente de validation par le secretariat du club.
              La boutique sera accessible une fois votre inscription validee.
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8] mb-4"></i>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  const categories = [
    { key: '', label: 'Tout', icon: 'fa-th' },
    { key: 'textile', label: 'Textile', icon: 'fa-tshirt' },
    { key: 'accessories', label: 'Accessoires', icon: 'fa-bag-shopping' },
    { key: 'equipment', label: 'Équipement', icon: 'fa-table-tennis-paddle-ball' }
  ]

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products

  const addToCart = (product: Product, size?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === size)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1, size }]
    })
  }

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.size === size)))
  }

  const updateQuantity = (productId: string, size: string | undefined, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId, size)
      return
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId && item.size === size
        ? { ...item, quantity }
        : item
    ))
  }

  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const handleOrder = async () => {
    if (cart.length === 0 || !user) return
    setOrderSubmitting(true)

    try {
      const supabase = createClient()
      const items = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        size: item.size || null,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))

      const { error } = await supabase.from('shop_orders').insert({
        member_id: user.id,
        items,
        total: cartTotal,
        status: 'pending',
        notes: `Commande de ${cart.reduce((s, i) => s + i.quantity, 0)} article(s)`,
      })

      if (error) throw error

      setCart([])
      setOrderSuccess(true)
      setTimeout(() => {
        setShowCart(false)
        setOrderSuccess(false)
      }, 5000)
    } catch (err: any) {
      alert('Erreur lors de la commande : ' + (err.message || 'Veuillez reessayer'))
    } finally {
      setOrderSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="text-[#3b9fd8]">Boutique</span> du Club
              </h1>
              <p className="text-gray-400 text-lg">
                Bienvenue {profile?.first_name || 'Membre'} ! Articles officiels TLSTT
              </p>
            </div>

            {/* Panier */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#2d8bc9] transition-colors"
            >
              <i className="fas fa-shopping-cart mr-2"></i>
              Panier
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
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
                    ? 'bg-[#3b9fd8] text-white'
                    : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-[#222]'
                }`}
              >
                <i className={`fas ${cat.icon} mr-2`}></i>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-12 -mt-4">
        {/* Section Cotisation HelloAsso */}
        {helloassoCotisationUrl && (
          <div className="mb-8 bg-gradient-to-r from-[#4c40cf]/10 to-[#3b9fd8]/10 border border-[#4c40cf]/30 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  <i className="fas fa-id-card mr-2 text-[#4c40cf]"></i>
                  Cotisation Saison 2025/2026
                </h2>
                <p className="text-gray-400 mb-4">
                  Renouvelez votre licence ou inscrivez-vous pour la nouvelle saison.
                  Paiement securise via HelloAsso.
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  <span className="bg-[#1a1a1a] px-3 py-1 rounded-full"><i className="fas fa-check mr-1 text-green-400"></i>Licence FFTT incluse</span>
                  <span className="bg-[#1a1a1a] px-3 py-1 rounded-full"><i className="fas fa-check mr-1 text-green-400"></i>Assurance</span>
                  <span className="bg-[#1a1a1a] px-3 py-1 rounded-full"><i className="fas fa-check mr-1 text-green-400"></i>Acces entrainements</span>
                </div>
              </div>
              <a
                href={helloassoCotisationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#4c40cf] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#3d32b0] transition-colors flex items-center gap-3 whitespace-nowrap"
              >
                <img src="https://api.helloasso.com/v5/img/logo-ha.svg" alt="HelloAsso" className="h-5" />
                S&apos;inscrire / Renouveler
              </a>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8] mb-4"></i>
            <p className="text-gray-500">Chargement des produits...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-2xl">
            <i className="fas fa-box-open text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">Aucun produit disponible</h3>
            <p className="text-gray-500">Revenez bientôt pour découvrir nos articles !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden hover:border-[#3b9fd8]/50 transition-colors">
                <div className="aspect-square bg-[#111] relative">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-image text-6xl text-gray-600"></i>
                    </div>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Plus que {product.stock} !
                    </span>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">Rupture de stock</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#3b9fd8]">{product.price.toFixed(2)}€</span>
                    {product.stock > 0 && (
                      <button
                        onClick={() => addToCart(product, product.sizes?.[0])}
                        className="bg-[#3b9fd8] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#2d8bc9] transition-colors"
                      >
                        <i className="fas fa-plus mr-1"></i> Ajouter
                      </button>
                    )}
                  </div>
                  {product.sizes && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {product.sizes.map(size => (
                        <span key={size} className="text-xs bg-[#333] text-gray-400 px-2 py-1 rounded">
                          {size}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Panier */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-[#333] z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  <i className="fas fa-shopping-cart mr-2 text-[#3b9fd8]"></i>
                  Panier
                </h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-white">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {orderSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-check-circle text-5xl text-green-500"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Commande enregistree !</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Votre commande a ete enregistree. Vous serez contacte pour le retrait au club.
                  </p>
                  <p className="text-gray-500 text-xs">
                    <i className="fas fa-envelope mr-1"></i>
                    Un recapitulatif vous sera envoye par email.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-shopping-cart text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-500">Votre panier est vide</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-[#111] rounded-lg flex items-center justify-center">
                            <i className="fas fa-tshirt text-2xl text-gray-600"></i>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{item.product.name}</div>
                            {item.size && <div className="text-gray-500 text-sm">Taille: {item.size}</div>}
                            <div className="text-[#3b9fd8] font-bold">{item.product.price.toFixed(2)}€</div>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id, item.size)} className="text-red-400 hover:text-red-300">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            className="w-8 h-8 bg-[#333] rounded-lg text-white hover:bg-[#444]"
                          >
                            -
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            className="w-8 h-8 bg-[#333] rounded-lg text-white hover:bg-[#444]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#333] pt-4">
                    <div className="flex justify-between text-lg mb-4">
                      <span className="text-gray-400">Total</span>
                      <span className="text-[#3b9fd8] font-bold text-2xl">{cartTotal.toFixed(2)}€</span>
                    </div>
                    {helloassoUrl ? (
                      <div className="space-y-3">
                        <a
                          href={helloassoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-[#4c40cf] text-white py-4 rounded-xl font-bold hover:bg-[#3d32b0] transition-colors flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-credit-card mr-1"></i>
                          Payer en ligne via HelloAsso
                        </a>
                        <button
                          onClick={handleOrder}
                          disabled={orderSubmitting}
                          className="w-full bg-[#1a1a1a] border border-[#3b9fd8]/50 text-[#3b9fd8] py-3 rounded-xl font-semibold hover:bg-[#3b9fd8]/10 transition-colors disabled:opacity-50"
                        >
                          {orderSubmitting ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i>Envoi...</>
                          ) : (
                            <><i className="fas fa-hand-holding mr-2"></i>Reserver (paiement au club)</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleOrder}
                        disabled={orderSubmitting}
                        className="w-full bg-[#3b9fd8] text-white py-4 rounded-xl font-bold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50"
                      >
                        {orderSubmitting ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</>
                        ) : (
                          <><i className="fas fa-shopping-bag mr-2"></i>Commander (retrait au club)</>
                        )}
                      </button>
                    )}
                    <p className="text-gray-600 text-xs text-center mt-3">
                      <i className="fas fa-store mr-1"></i>
                      Retrait des articles au gymnase lors des entrainements
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
