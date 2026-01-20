import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminActualitesPage() {
  const supabase = await createClient()

  // Récupérer toutes les actualités
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })

  // Statistiques
  const stats = {
    total: news?.length || 0,
    published: news?.filter(n => n.status === 'published').length || 0,
    draft: news?.filter(n => n.status === 'draft').length || 0,
    club: news?.filter(n => n.category === 'club').length || 0,
    tt: news?.filter(n => n.category === 'tt').length || 0,
    handi: news?.filter(n => n.category === 'handi').length || 0,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Actualités</h1>
          <p className="text-gray-600 mt-1">Gérez toutes vos actualités</p>
        </div>
        <Link
          href="/admin/actualites/nouveau"
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nouvelle actualité
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-2xl font-bold text-gray-900">{stats.published}</div>
          <div className="text-sm text-gray-600">Publiées</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-gray-900">{stats.draft}</div>
          <div className="text-sm text-gray-600">Brouillons</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-gray-900">{stats.club}</div>
          <div className="text-sm text-gray-600">Club</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-cyan-500">
          <div className="text-2xl font-bold text-gray-900">{stats.tt}</div>
          <div className="text-sm text-gray-600">TT</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-2xl font-bold text-gray-900">{stats.handi}</div>
          <div className="text-sm text-gray-600">Handi</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-lg font-semibold">
            Toutes
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Publiées
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Brouillons
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Club
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            TT
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Handi
          </button>
        </div>
      </div>

      {/* Liste des actualités */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {news && news.length > 0 ? (
              news.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                        {article.excerpt && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {article.excerpt}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.category === 'club' ? 'bg-purple-100 text-purple-800' :
                      article.category === 'tt' ? 'bg-cyan-100 text-cyan-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {article.category === 'club' ? 'Club' : article.category === 'tt' ? 'TT' : 'Handi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.status === 'published' ? 'Publiée' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/actualites/${article.category}/${article.id}`}
                      target="_blank"
                      className="text-primary hover:text-primary-light mr-3"
                    >
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link
                      href={`/admin/actualites/${article.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button className="text-red-600 hover:text-red-900">
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <i className="fas fa-newspaper text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">Aucune actualité pour le moment</p>
                  <Link
                    href="/admin/actualites/nouveau"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Créer votre première actualité
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
