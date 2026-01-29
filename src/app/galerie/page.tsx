import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export default async function GaleriePage() {
  const supabase = await createClient()

  const { data: albums } = await supabase
    .from('albums')
    .select('*, photos(count)')
    .eq('published', true)
    .order('created_at', { ascending: false })

  const totalAlbums = albums?.length || 0
  const totalPhotos = albums?.reduce((sum, album) => sum + (album.photos?.[0]?.count || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0f3057] py-12">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-400 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-images text-4xl text-[#5bc0de]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">Galerie Photo</h1>
              <p className="text-gray-300">Découvrez les meilleurs moments du club TLSTT en images</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <p className="text-sm text-gray-500">Albums</p>
            <p className="text-3xl font-bold text-[#0f3057]">{totalAlbums}</p>
            <i className="fas fa-folder text-[#5bc0de] mt-1"></i>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <p className="text-sm text-gray-500">Photos</p>
            <p className="text-3xl font-bold text-[#0f3057]">{totalPhotos}</p>
            <i className="fas fa-camera text-[#5bc0de] mt-1"></i>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <p className="text-sm text-gray-500">Événements</p>
            <p className="text-3xl font-bold text-[#0f3057]">{totalAlbums}</p>
            <i className="fas fa-calendar-check text-[#5bc0de] mt-1"></i>
          </div>
        </div>

        {/* Albums grid */}
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/galerie/${album.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  {album.cover_url ? (
                    <Image
                      src={album.cover_url}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-images text-4xl text-gray-400"></i>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                    <i className="fas fa-image mr-1"></i>
                    {album.photos?.[0]?.count || 0}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#5bc0de] transition-colors">
                    {album.title}
                  </h2>
                  {album.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{album.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    <i className="far fa-calendar mr-1"></i>
                    {new Date(album.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <i className="fas fa-images text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-bold text-[#5bc0de] mb-2">Aucun album pour le moment</h3>
            <p className="text-gray-500">Les albums photos seront bientôt disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
