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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-images text-4xl text-[#3b9fd8]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">Galerie Photo</h1>
              <p className="text-gray-400">Découvrez les meilleurs moments du club TLSTT en images</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Albums</p>
            <p className="text-3xl font-bold text-white">{totalAlbums}</p>
            <i className="fas fa-folder text-[#3b9fd8] mt-1"></i>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Photos</p>
            <p className="text-3xl font-bold text-white">{totalPhotos}</p>
            <i className="fas fa-camera text-[#3b9fd8] mt-1"></i>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Événements</p>
            <p className="text-3xl font-bold text-white">{totalAlbums}</p>
            <i className="fas fa-calendar-check text-[#3b9fd8] mt-1"></i>
          </div>
        </div>

        {/* Albums grid */}
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/galerie/${album.id}`}
                className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-1 group"
              >
                <div className="relative h-48 overflow-hidden bg-[#111]">
                  {album.cover_url ? (
                    <Image
                      src={album.cover_url}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-images text-4xl text-gray-600"></i>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                    <i className="fas fa-image mr-1"></i>
                    {album.photos?.[0]?.count || 0}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-white group-hover:text-[#3b9fd8] transition-colors">
                    {album.title}
                  </h2>
                  {album.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{album.description}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-2">
                    <i className="far fa-calendar mr-1"></i>
                    {new Date(album.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-12 text-center">
            <i className="fas fa-images text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-bold text-[#3b9fd8] mb-2">Aucun album pour le moment</h3>
            <p className="text-gray-500">Les albums photos seront bientôt disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
