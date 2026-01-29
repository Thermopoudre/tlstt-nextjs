import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Récupérer les statistiques
  const [
    { count: totalNews },
    { count: totalPlayers },
    { count: totalMessages },
    { count: totalAlbums },
    { data: recentNews },
    { data: recentMessages },
  ] = await Promise.all([
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }).eq('admin_notes', 'TLSTT'),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('albums').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('contact_messages').select('*').eq('status', 'new').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre site TLSTT</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Actualités</p>
              <p className="text-3xl font-bold text-primary">{totalNews || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-newspaper text-2xl text-blue-600"></i>
            </div>
          </div>
          <Link href="/admin/actualites" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
            Gérer →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Joueurs</p>
              <p className="text-3xl font-bold text-primary">{totalPlayers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-2xl text-green-600"></i>
            </div>
          </div>
          <Link href="/admin/joueurs" className="text-sm text-green-600 hover:underline mt-4 inline-block">
            Gérer →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Messages</p>
              <p className="text-3xl font-bold text-primary">{totalMessages || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-envelope text-2xl text-red-600"></i>
            </div>
          </div>
          <Link href="/admin/messages" className="text-sm text-red-600 hover:underline mt-4 inline-block">
            Voir →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Albums</p>
              <p className="text-3xl font-bold text-primary">{totalAlbums || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-images text-2xl text-purple-600"></i>
            </div>
          </div>
          <Link href="/admin/galerie" className="text-sm text-purple-600 hover:underline mt-4 inline-block">
            Gérer →
          </Link>
        </div>
      </div>

      {/* Dernières actualités et messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières actualités */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary">
              <i className="fas fa-newspaper mr-2"></i>
              Dernières actualités
            </h3>
            <Link href="/admin/actualites/nouveau" className="btn-primary text-sm">
              <i className="fas fa-plus mr-2"></i>
              Nouveau
            </Link>
          </div>
          <div className="space-y-3">
            {recentNews && recentNews.length > 0 ? (
              recentNews.map((article: any) => (
                <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{article.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(article.created_at).toLocaleDateString('fr-FR')} • {article.category}
                    </p>
                  </div>
                  <Link 
                    href={`/admin/actualites/${article.id}/edit`}
                    className="text-primary hover:text-secondary"
                  >
                    <i className="fas fa-edit"></i>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune actualité</p>
            )}
          </div>
        </div>

        {/* Messages non lus */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary">
              <i className="fas fa-envelope mr-2"></i>
              Messages non lus
            </h3>
            <Link href="/admin/messages" className="text-primary hover:underline text-sm">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {recentMessages && recentMessages.length > 0 ? (
              recentMessages.map((message: any) => (
                <div key={message.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                    {message.name[0]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{message.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{message.subject}</p>
                  </div>
                  <Link 
                    href={`/admin/messages/${message.id}`}
                    className="text-primary hover:text-secondary"
                  >
                    <i className="fas fa-eye"></i>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun message</p>
            )}
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-primary mb-4">
          <i className="fas fa-bolt mr-2"></i>
          Accès rapides
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/actualites/nouveau" className="card text-center hover:scale-105 transition-transform">
            <i className="fas fa-plus-circle text-4xl text-blue-600 mb-2"></i>
            <p className="font-semibold">Nouvelle actualité</p>
          </Link>
          <Link href="/admin/planning" className="card text-center hover:scale-105 transition-transform">
            <i className="fas fa-calendar-plus text-4xl text-green-600 mb-2"></i>
            <p className="font-semibold">Gérer planning</p>
          </Link>
          <Link href="/admin/galerie" className="card text-center hover:scale-105 transition-transform">
            <i className="fas fa-image text-4xl text-purple-600 mb-2"></i>
            <p className="font-semibold">Ajouter photos</p>
          </Link>
          <Link href="/admin/parametres" className="card text-center hover:scale-105 transition-transform">
            <i className="fas fa-cog text-4xl text-gray-600 mb-2"></i>
            <p className="font-semibold">Paramètres</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
