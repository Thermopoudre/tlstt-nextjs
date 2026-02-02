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
                        <button className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg" title="Voir détails"><i className="fas fa-eye"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
