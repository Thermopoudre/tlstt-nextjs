'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  totalMembers: number
  pendingMembers: number
  totalArticles: number
  publishedArticles: number
  totalNewsletters: number
  totalSubscribers: number
  activeSubscribers: number
  totalTeams: number
  totalPlayers: number
  totalAlbums: number
  totalPhotos: number
  totalProducts: number
  totalOrders: number
  recentArticles: any[]
  recentMembers: any[]
  popularCategories: { category: string; count: number }[]
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const supabase = createClient()

    const [
      { count: totalMembers },
      { count: pendingMembers },
      { count: totalArticles },
      { count: publishedArticles },
      { count: totalNewsletters },
      { count: totalSubscribers },
      { count: activeSubscribers },
      { count: totalTeams },
      { count: totalPlayers },
      { count: totalAlbums },
      { count: totalPhotos },
      { count: totalProducts },
      { count: totalOrders },
      { data: recentArticles },
      { data: recentMembers },
      { data: newsCategories },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_validated', false),
      supabase.from('news').select('*', { count: 'exact', head: true }),
      supabase.from('news').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('newsletters').select('*', { count: 'exact', head: true }),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_subscribed', true),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('albums').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase.from('shop_products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('shop_orders').select('*', { count: 'exact', head: true }),
      supabase.from('news').select('id, title, category, status, published_at').order('published_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, first_name, last_name, created_at, is_validated').order('created_at', { ascending: false }).limit(5),
      supabase.from('news').select('category').eq('status', 'published'),
    ])

    // Count categories
    const catMap: Record<string, number> = {}
    ;(newsCategories || []).forEach((n: any) => {
      catMap[n.category] = (catMap[n.category] || 0) + 1
    })
    const popularCategories = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    setStats({
      totalMembers: totalMembers || 0,
      pendingMembers: pendingMembers || 0,
      totalArticles: totalArticles || 0,
      publishedArticles: publishedArticles || 0,
      totalNewsletters: totalNewsletters || 0,
      totalSubscribers: totalSubscribers || 0,
      activeSubscribers: activeSubscribers || 0,
      totalTeams: totalTeams || 0,
      totalPlayers: totalPlayers || 0,
      totalAlbums: totalAlbums || 0,
      totalPhotos: totalPhotos || 0,
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      recentArticles: recentArticles || [],
      recentMembers: recentMembers || [],
      popularCategories,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    )
  }

  if (!stats) return null
  const s = stats

  const kpis = [
    { label: 'Membres', value: s.totalMembers, icon: 'fa-users', color: 'text-blue-600', bgColor: 'bg-blue-50', sub: `${s.pendingMembers} en attente` },
    { label: 'Articles', value: s.publishedArticles, icon: 'fa-newspaper', color: 'text-green-600', bgColor: 'bg-green-50', sub: `${s.totalArticles} total` },
    { label: 'Abonnes newsletter', value: s.activeSubscribers, icon: 'fa-envelope', color: 'text-purple-600', bgColor: 'bg-purple-50', sub: `${s.totalSubscribers} total` },
    { label: 'Equipes', value: s.totalTeams, icon: 'fa-users-line', color: 'text-orange-600', bgColor: 'bg-orange-50', sub: `${s.totalPlayers} joueurs` },
    { label: 'Albums / Photos', value: s.totalAlbums, icon: 'fa-images', color: 'text-pink-600', bgColor: 'bg-pink-50', sub: `${s.totalPhotos} photos` },
    { label: 'Boutique', value: s.totalProducts, icon: 'fa-store', color: 'text-teal-600', bgColor: 'bg-teal-50', sub: `${s.totalOrders} commandes` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary">Dashboard Analytics</h1>
        <p className="text-gray-600 mt-1">Vue d&apos;ensemble du site et de l&apos;activite</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
              <div className={`w-10 h-10 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`fas ${kpi.icon} ${kpi.color}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent articles */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-newspaper mr-2 text-primary"></i>
            Derniers articles
          </h2>
          <div className="space-y-3">
            {s.recentArticles.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className={`w-2 h-2 rounded-full ${a.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">
                    {a.category} - {a.published_at ? new Date(a.published_at).toLocaleDateString('fr-FR') : 'Brouillon'}
                  </p>
                </div>
              </div>
            ))}
            {s.recentArticles.length === 0 && <p className="text-gray-400 text-sm">Aucun article</p>}
          </div>
        </div>

        {/* Recent members */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-user-plus mr-2 text-primary"></i>
            Derniers membres inscrits
          </h2>
          <div className="space-y-3">
            {s.recentMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${m.is_validated ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {(m.first_name?.[0] || '?').toUpperCase()}{(m.last_name?.[0] || '').toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {m.is_validated ? 'Valide' : 'En attente'}
                </span>
              </div>
            ))}
            {s.recentMembers.length === 0 && <p className="text-gray-400 text-sm">Aucun membre</p>}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-chart-bar mr-2 text-primary"></i>
            Articles par categorie
          </h2>
          <div className="space-y-3">
            {s.popularCategories.map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium w-24 capitalize">{cat.category}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (cat.count / (s.publishedArticles || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-600 w-8 text-right">{cat.count}</span>
              </div>
            ))}
            {s.popularCategories.length === 0 && <p className="text-gray-400 text-sm">Aucune donnee</p>}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-bolt mr-2 text-primary"></i>
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/admin/actualites" className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700">
              <i className="fas fa-plus text-green-500"></i>Nouvel article
            </a>
            <a href="/admin/newsletter" className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700">
              <i className="fas fa-paper-plane text-blue-500"></i>Newsletter
            </a>
            <a href="/admin/equipes" className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700">
              <i className="fas fa-sync text-orange-500"></i>Sync equipes
            </a>
            <a href="/admin/membres" className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700">
              <i className="fas fa-user-check text-purple-500"></i>Valider membres
            </a>
            <a href="/admin/galerie" className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700">
              <i className="fas fa-images text-pink-500"></i>Galerie
            </a>
            <a href="/admin/pages/builder" className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium text-gray-700">
              <i className="fas fa-puzzle-piece text-teal-500"></i>Page Builder
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
