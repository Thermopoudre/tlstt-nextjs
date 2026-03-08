import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function AdminGaleriePage() {
  const supabase = await createClient()

  // Récupérer tous les albums avec leur nombre de photos
  const { data: albums } = await supabase
    .from('albums')
    .select(`
      *,
      photos:photos(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Galerie Photo</h1>
          <p className="text-gray-600 mt-1">Gérez vos albums et photos</p>
        </div>
        <Link
          href="/admin/galerie/nouveau"
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nouvel album
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-gray-900">{albums?.length || 0}</div>
          <div className="text-gray-600">Albums</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-3xl font-bold text-gray-900">
            {albums?.reduce((acc, album) => acc + (album.photos[0]?.count || 0), 0) || 0}
          </div>
          <div className="text-gray-600">Photos</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-3xl font-bold text-gray-900">
            {albums?.filter(a => a.status === 'published').length || 0}
          </div>
          <div className="text-gray-600">Publiés</div>
        </div>
      </div>

      {/* Liste des albums */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums && albums.length > 0 ? (
          albums.map((album) => (
            <div key={album.id} className="bg-white rounded-lg shadow overflow-hidden group">
              <div className="relative h-48 bg-gray-200">
                {/* Image placeholder - vous pouvez ajouter une vraie image de couverture */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-blue-700">
                  <i className="fas fa-images text-6xl text-white opacity-50"></i>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    album.status === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                  }`}>
                    {album.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{album.title}</h3>
                {album.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{album.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fas fa-images mr-1"></i>
                    {album.photos[0]?.count || 0} photos
                  </span>
                  <span>
                    <i className="fas fa-calendar mr-1"></i>
                    {new Date(album.event_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/galerie/${album.id}`}
                    target="_blank"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700"
                  >
                    <i className="fas fa-eye mr-1"></i> Voir
                  </Link>
                  <Link
                    href={`/admin/galerie/${album.id}/edit`}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded text-center hover:bg-gray-700"
                  >
                    <i className="fas fa-edit mr-1"></i> Modifier
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
            <i className="fas fa-images text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Aucun album</h2>
            <p className="text-gray-500 mb-4">Créez votre premier album photo</p>
            <Link
              href="/admin/galerie/nouveau"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light inline-block"
            >
              Créer un album
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
