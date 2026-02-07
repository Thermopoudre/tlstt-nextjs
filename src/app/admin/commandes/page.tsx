'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_at: string
  items: any[]
}

export default function AdminCommandesPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const { data } = await supabase.from('shop_orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const updateStatus = async (id: number, status: string) => {
    await supabase.from('shop_orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En attente</span>
      case 'processing': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">En cours</span>
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Terminée</span>
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Annulée</span>
      default: return null
    }
  }

  const filteredOrders = orders.filter(o => {
    if (filter === 'pending') return o.status === 'pending' || o.status === 'processing'
    if (filter === 'completed') return o.status === 'completed'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Commandes</h1>
          <p className="text-gray-600 mt-1">Gérez les commandes de la boutique</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-primary">{orders.length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">En attente</p><p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">Terminées</p><p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'completed').length}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-600">CA</p><p className="text-2xl font-bold text-primary">{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)}€</p></div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2">
          {(['pending', 'completed', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'pending' ? 'À traiter' : f === 'completed' ? 'Terminées' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center"><i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i><p className="text-gray-500 text-lg">Aucune commande</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-600">Commande</th>
                  <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">Client</th>
                  <th className="px-4 lg:px-6 py-4 text-right text-sm font-semibold text-gray-600">Total</th>
                  <th className="px-4 lg:px-6 py-4 text-center text-sm font-semibold text-gray-600">Statut</th>
                  <th className="px-4 lg:px-6 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4"><p className="font-semibold text-gray-900">#{order.order_number}</p><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p></td>
                    <td className="px-4 lg:px-6 py-4 hidden sm:table-cell"><p className="text-gray-900">{order.customer_name}</p><p className="text-xs text-gray-500">{order.customer_email}</p></td>
                    <td className="px-4 lg:px-6 py-4 text-right"><span className="font-bold text-primary">{order.total}€</span></td>
                    <td className="px-4 lg:px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'pending' && <button onClick={() => updateStatus(order.id, 'processing')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Marquer en cours"><i className="fas fa-play"></i></button>}
                        {order.status === 'processing' && <button onClick={() => updateStatus(order.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Marquer terminée"><i className="fas fa-check"></i></button>}
                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg" title="Voir détails"><i className="fas fa-eye"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal Details */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedOrder(null)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Commande #{selectedOrder.order_number}</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Client</p><p className="font-semibold">{selectedOrder.customer_name}</p></div>
                  <div><p className="text-sm text-gray-500">Email</p><p className="font-semibold">{selectedOrder.customer_email}</p></div>
                  <div><p className="text-sm text-gray-500">Date</p><p className="font-semibold">{new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                  <div><p className="text-sm text-gray-500">Statut</p>{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-800 mb-3">Articles</h3>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{item.name || `Article #${idx + 1}`}</p>
                            {item.size && <p className="text-xs text-gray-500">Taille: {item.size}</p>}
                            <p className="text-xs text-gray-500">Qte: {item.quantity || 1}</p>
                          </div>
                          <p className="font-bold text-primary">{item.price || '-'}€</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun detail disponible</p>
                  )}
                </div>
                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-primary">{selectedOrder.total}€</span>
                </div>
                <div className="flex gap-2 pt-2">
                  {selectedOrder.status === 'pending' && (
                    <button onClick={() => { updateStatus(selectedOrder.id, 'processing'); setSelectedOrder(null); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <i className="fas fa-play mr-2"></i>En cours
                    </button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <i className="fas fa-check mr-2"></i>Terminee
                    </button>
                  )}
                  <button onClick={() => setSelectedOrder(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Fermer</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
