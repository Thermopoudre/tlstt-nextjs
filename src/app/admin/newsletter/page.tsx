'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadSubscribers()
  }, [])

  const loadSubscribers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setSubscribers(data)
    setLoading(false)
  }

  const handleExport = () => {
    setExporting(true)
    
    const active = subscribers.filter(s => s.is_subscribed)
    const csv = [
      'Email,Prénom,Nom,Date inscription,Statut',
      ...active.map(s => 
        `"${s.email}","${s.first_name || ''}","${s.last_name || ''}","${new Date(s.created_at).toLocaleDateString('fr-FR')}","Actif"`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `newsletter-tlstt-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    setExporting(false)
  }

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.is_subscribed).length,
    unsubscribed: subscribers.filter(s => !s.is_subscribed).length,
  }

  if (loading) {
    return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-600 mt-1">Gérez vos abonnés</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || stats.active === 0}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light flex items-center gap-2"
        >
          <i className="fas fa-download"></i>
          Exporter CSV ({stats.active})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-gray-600">Total</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
          <div className="text-gray-600">Actifs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-3xl font-bold text-gray-900">{stats.unsubscribed}</div>
          <div className="text-gray-600">Désabonnés</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {sub.first_name && sub.last_name ? `${sub.first_name} ${sub.last_name}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(sub.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    sub.is_subscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sub.is_subscribed ? 'Actif' : 'Désabonné'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
