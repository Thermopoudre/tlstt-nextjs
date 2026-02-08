import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, generatePageMeta } from '@/lib/seo'

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: album } = await supabase
    .from('albums')
    .select('title, description, cover_url')
    .eq('id', parseInt(id))
    .single()

  if (!album) {
    return { title: 'Album non trouvé' }
  }

  return generatePageMeta({
    title: `${album.title} - Galerie Photo`,
    description: album.description || `Album photo "${album.title}" du club TLSTT Toulon La Seyne Tennis de Table.`,
    path: `/galerie/${id}`,
    image: album.cover_url || undefined,
    keywords: ['galerie', 'photos', album.title, 'TLSTT', 'tennis de table'],
  })
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Récupérer l'album
  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', parseInt(id))
    .single()

  if (error || !album) {
    notFound()
  }

  // Récupérer les photos de l'album
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', album.id)
    .order('display_order')

  return (
    <div className="container-custom">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Galerie', url: '/galerie' },
        { name: album.title, url: `/galerie/${id}` },
      ])} />
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-600 hover:text-primary">
              Accueil
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/galerie" className="text-gray-600 hover:text-primary">
              Galerie
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-semibold">{album.title}</li>
        </ol>
      </nav>

      {/* Header de l'album */}
      <div className="card mb-8 bg-gradient-to-r from-primary to-blue-700 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3">
              <i className="fas fa-images mr-3"></i>
              {album.title}
            </h1>
            {album.description && (
              <p className="text-blue-100 text-lg mb-4">{album.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <i className="fas fa-calendar"></i>
                {new Date(album.event_date || album.created_at).toLocaleDateString('fr-FR')}
              </span>
              <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <i className="fas fa-camera"></i>
                {photos?.length || 0} photos
              </span>
              {album.event_type && (
                <span className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full">
                  <i className="fas fa-tag"></i>
                  {album.event_type}
                </span>
              )}
            </div>
          </div>
          
          <Link
            href="/galerie"
            className="btn-primary bg-white text-primary hover:bg-gray-100"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour à la galerie
          </Link>
        </div>
      </div>

      {/* Grille de photos */}
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <Image
                src={photo.url}
                alt={photo.title || `Photo ${photo.id}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              
              {/* Overlay au survol */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  {photo.title && (
                    <h3 className="font-bold text-lg mb-1">{photo.title}</h3>
                  )}
                  {photo.description && (
                    <p className="text-sm text-gray-200 line-clamp-2">{photo.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {photo.likes > 0 && (
                      <span className="flex items-center gap-1">
                        <i className="fas fa-heart"></i>
                        {photo.likes}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <i className="fas fa-eye"></i>
                      Voir
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <i className="fas fa-images text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune photo dans cet album</h3>
          <p className="text-gray-500">Les photos seront bientôt ajoutées</p>
        </div>
      )}

      {/* Bouton de retour en bas */}
      <div className="mt-8 text-center">
        <Link href="/galerie" className="btn-primary">
          <i className="fas fa-arrow-left mr-2"></i>
          Retour à la galerie
        </Link>
      </div>
    </div>
  )
}
