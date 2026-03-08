'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ConfirmModal from '@/components/admin/ConfirmModal'

interface Article {
  id: string
  title: string
  excerpt: string | null
  category: string
  status: string
  created_at: string
  image_url: string | null
}

export default function AdminActualitesPage() {
  const supabase = createClient()
  const [news, setNews] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null)

  useEffect(() => { fetchNews() }, [])

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false })
    if (data) setNews(data)
    setLoading(false)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('news').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    fetchNews()
  }

  const toggleStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await supabase.from('news').update({ status: newStatus }).eq('id', article.id)
    fetchNews()
  }

  const filteredNews = news.filter(n => {
    if (filter === 'all') return true
    if (filter === 'published' || filter === 'draft') return n.status === filter
    return n.category === filter
  })

  const stats = {
    total: news.length,
    published: news.filter(n => n.status === 'published').length,
    draft: news.filter(n => n.status === 'draft').length,
    club: news.filter(n => n.category === 'club').length,
    tt: news.filter(n => n.category === 'tt').length,
    handi: news.filter(n => n.category === 'handi').length,
  }

  const filters = [
    { key: 'all', label: 'Toutes', count: stats.total },
    { key: 'published', label: 'Publiees', count: stats.published },
    { key: 'draft', label: 'Brouillons', count: stats.draft },
    { key: 'club', label: 'Club', count: stats.club },
    { key: 'tt', label: 'TT', count: stats.tt },
    { key: 'handi', label: 'Handi', count: stats.handi },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Actualites</h1>
          <p className="text-gray-600 mt-1">Gerez toutes vos actualites</p>
        </div>
        <Link href="/admin/actualites/nouveau" className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouvelle actualite
        </Link>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'blue' },
          { label: 'Publiees', value: stats.published, color: 'green' },
          { label: 'Brouillons', value: stats.draft, color: 'yellow' },
          { label: 'Club', value: stats.club, color: 'purple' },
          { label: 'TT', value: stats.tt, color: 'cyan' },
          { label: 'Handi', value: stats.handi, color: 'orange' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl shadow p-4 border-l-4 border-${s.color}-500`}>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-newspaper text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune actualite</h3>
          <Link href="/admin/actualites/nouveau" className="btn-primary mt-4 inline-flex items-center gap-2">
            <i className="fas fa-plus"></i>Creer la premiere
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Article</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Categorie</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredNews.map(article => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{article.title}</p>
                    {article.excerpt && <p className="text-xs text-gray-500 line-clamp-1">{article.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      article.category === 'club' ? 'bg-purple-100 text-purple-800' :
                      article.category === 'tt' ? 'bg-cyan-100 text-cyan-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>{article.category === 'club' ? 'Club' : article.category === 'tt' ? 'TT' : 'Handi'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleStatus(article)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                        article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {article.status === 'published' ? 'Publiee' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/actualites/${article.category}/${article.id}`} target="_blank" className="p-2 text-primary hover:bg-primary/10 rounded-lg inline-flex"><i className="fas fa-eye"></i></Link>
                    <Link href={`/admin/actualites/${article.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex"><i className="fas fa-edit"></i></Link>
                    <button onClick={() => setDeleteTarget({ id: article.id, title: article.title })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </div>
  )
}
