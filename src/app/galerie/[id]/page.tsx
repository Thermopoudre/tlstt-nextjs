import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { breadcrumbJsonLd, generatePageMeta } from '@/lib/seo'
import PhotoGalleryClient from './PhotoGalleryClient'

export const revalidate = 3600

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

  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', parseInt(id))
    .single()

  if (error || !album) {
    notFound()
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', album.id)
    .order('display_order')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Galerie', url: '/galerie' },
        { name: album.title, url: `/galerie/${id}` },
      ])} />

      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-images text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{album.title}</h1>
                {album.description && (
                  <p className="text-gray-400 mt-1">{album.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-gray-500 text-sm">
                    <i className="fas fa-calendar mr-1"></i>
                    {new Date(album.event_date || album.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-gray-500 text-sm">
                    <i className="fas fa-camera mr-1"></i>
                    {photos?.length || 0} photo{(photos?.length || 0) > 1 ? 's' : ''}
                  </span>
                  {album.season && (
                    <span className="bg-[#3b9fd8]/10 text-[#3b9fd8] text-xs px-3 py-1 rounded-full border border-[#3b9fd8]/30">
                      <i className="fas fa-tag mr-1"></i>
                      {album.season}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/galerie"
              className="bg-[#1a1a1a] border border-[#333] text-white px-5 py-2.5 rounded-xl font-semibold hover:border-[#3b9fd8]/50 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour à la galerie
            </Link>
          </div>
        </div>
      </div>

      {/* Grille de photos */}
      <div className="container-custom py-8">
        {photos && photos.length > 0 ? (
          <PhotoGalleryClient photos={photos} />
        ) : (
          <div className="text-center py-16 bg-[#1a1a1a] border border-[#333] rounded-2xl">
            <i className="fas fa-images text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune photo dans cet album</h3>
            <p className="text-gray-500">Les photos seront bientôt ajoutées</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/galerie"
            className="inline-flex items-center bg-[#3b9fd8] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour à la galerie
          </Link>
        </div>
      </div>
    </div>
  )
}
