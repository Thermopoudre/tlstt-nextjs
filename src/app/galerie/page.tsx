import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function GaleriePage() {
  const supabase = await createClient()

  // Récupérer tous les albums avec le nombre de photos
  const { data: albums } = await supabase
    .from('albums')
    .select(`
      *,
      photos:photos(count)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Récupérer la photo de couverture pour chaque album
  const albumsWithCovers = await Promise.all(
    (albums || []).map(async (album) => {
      const { data: cover } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', album.id)
        .limit(1)
        .single()

      return {
        ...album,
        coverPhoto: cover,
        photoCount: album.photos[0]?.count || 0
      }
    })
  )

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          <i className="fas fa-images mr-3"></i>
          Galerie Photo
        </h1>
        <p className="text-lg text-gray-600">
          Découvrez les meilleurs moments du club TLSTT en images
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Albums</p>
              <p className="text-3xl font-bold text-primary">{albums?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-folder text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="card text-center border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Photos</p>
              <p className="text-3xl font-bold text-primary">
                {albumsWithCovers.reduce((acc, album) => acc + album.photoCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-camera text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="card text-center border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Événements</p>
              <p className="text-3xl font-bold text-primary">
                {new Set(albums?.map(a => a.event_type)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-check text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des albums */}
      {albumsWithCovers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albumsWithCovers.map((album) => (
            <Link
              key={album.id}
              href={`/galerie/${album.id}`}
              className="group"
            >
              <div className="card overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {/* Image de couverture */}
                <div className="relative h-64 bg-gray-200 overflow-hidden">
                  {album.coverPhoto ? (
                    <Image
                      src={album.coverPhoto.url}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-blue-400">
                      <i className="fas fa-images text-6xl text-white opacity-50"></i>
                    </div>
                  )}
                  
                  {/* Badge nombre de photos */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
                    <i className="fas fa-camera text-primary"></i>
                    <span className="font-bold text-gray-800">{album.photoCount}</span>
                  </div>

                  {/* Badge type d'événement */}
                  {album.event_type && (
                    <div className="absolute bottom-4 left-4 bg-secondary/90 backdrop-blur-sm rounded-full px-3 py-1 text-white font-semibold text-sm">
                      {album.event_type}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-secondary transition-colors">
                    {album.title}
                  </h3>
                  
                  {album.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {album.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-calendar"></i>
                      {new Date(album.event_date || album.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-1">
                      Voir l'album
                      <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <i className="fas fa-images text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun album pour le moment</h3>
          <p className="text-gray-500">Les albums photos seront bientôt disponibles</p>
        </div>
      )}
    </div>
  )
}
