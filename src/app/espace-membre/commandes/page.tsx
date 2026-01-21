'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  items: {
    product_id: string
    name: string
    quantity: number
    size?: string
    price: number
  }[]
  total: number
  status: string
  notes: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: 'fa-clock' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500', icon: 'fa-check' },
  ready: { label: 'Prête', color: 'bg-green-500', icon: 'fa-box' },
  delivered: { label: 'Livrée', color: 'bg-gray-500', icon: 'fa-check-double' },
}

export default function CommandesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [loading, user, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from('shop_orders')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setIsLoading(false)
    }
    if (user) fetchOrders()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f3057] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de]"></i>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0f3057]">
      <div className="py-12">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li><Link href="/espace-membre" className="hover:text-[#5bc0de]">Espace Membre</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Mes Commandes</li>
            </ol>
          </nav>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <i className="fas fa-box mr-3 text-[#5bc0de]"></i>
                Mes Commandes
              </h1>
              <p className="text-white/60">Historique de vos commandes boutique</p>
            </div>
            <Link
              href="/boutique"
              className="bg-[#5bc0de] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4ab0ce] transition-colors"
            >
              <i className="fas fa-shopping-bag mr-2"></i>
              Boutique
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
              <p className="text-white/60">Chargement des commandes...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white/10 rounded-2xl">
              <i className="fas fa-box-open text-6xl text-white/30 mb-4"></i>
              <h3 className="text-xl font-bold text-white/80 mb-2">Aucune commande</h3>
              <p className="text-white/60 mb-6">Vous n'avez pas encore passé de commande</p>
              <Link
                href="/boutique"
                className="inline-block bg-[#5bc0de] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4ab0ce]"
              >
                <i className="fas fa-shopping-bag mr-2"></i>
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const status = statusConfig[order.status] || statusConfig.pending
                return (
                  <div key={order.id} className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1`}>
                            <i className={`fas ${status.icon}`}></i>
                            {status.label}
                          </span>
                          <span className="text-white/50 text-sm">
                            Commande du {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs mt-1 font-mono">#{order.id.slice(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#5bc0de]">{order.total.toFixed(2)}€</div>
                        <div className="text-white/50 text-sm">{order.items.length} article{order.items.length > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                              <i className="fas fa-tshirt text-white/40"></i>
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-semibold">{item.name}</div>
                              <div className="text-white/50 text-sm">
                                {item.size && <span>Taille {item.size} • </span>}
                                Quantité: {item.quantity}
                              </div>
                            </div>
                            <div className="text-[#5bc0de] font-semibold">
                              {(item.price * item.quantity).toFixed(2)}€
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/60 text-sm">
                            <i className="fas fa-comment mr-2"></i>
                            {order.notes}
                          </p>
                        </div>
                      )}
                      {order.status === 'ready' && (
                        <div className="mt-4 p-4 bg-green-500/20 rounded-xl">
                          <p className="text-green-400 font-semibold">
                            <i className="fas fa-check-circle mr-2"></i>
                            Votre commande est prête ! Vous pouvez la récupérer au club.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
