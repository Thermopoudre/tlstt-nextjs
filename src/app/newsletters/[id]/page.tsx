import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import JsonLd from '@/components/seo/JsonLd'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { articleJsonLd, breadcrumbJsonLd, autoDescription, generatePageMeta } from '@/lib/seo'

export const revalidate = 3600

interface NewsletterPageProps {
  params: Promise<{ id: string }>
}

export default async function NewsletterDetailPage({ params }: NewsletterPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', parseInt(id))
    .single()

  if (!newsletter) {
    notFound()
  }

  const jsonLdData = [
    articleJsonLd({
      title: newsletter.title,
      description: newsletter.excerpt || autoDescription(newsletter.content || ''),
      url: `/newsletters/${id}`,
      image: newsletter.cover_image_url || undefined,
      publishedTime: newsletter.published_at || newsletter.created_at,
      modifiedTime: newsletter.updated_at || newsletter.published_at,
      category: 'Newsletter',
    }),
    breadcrumbJsonLd([
      { name: 'Accueil', url: '/' },
      { name: 'Newsletters', url: '/newsletters' },
      { name: newsletter.title, url: `/newsletters/${id}` },
    ]),
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={jsonLdData} />

      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-envelope-open-text text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{newsletter.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>
                    <i className="fas fa-calendar mr-1 text-[#3b9fd8]"></i>
                    {new Date(newsletter.published_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/newsletters"
              className="bg-[#1a1a1a] border border-[#333] text-white px-5 py-2.5 rounded-xl font-semibold hover:border-[#3b9fd8]/50 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour aux newsletters
            </Link>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container-custom py-12">
        <article className="max-w-3xl mx-auto">
          {newsletter.cover_image_url && (
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
              <Image
                src={newsletter.cover_image_url}
                alt={newsletter.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8">
            <div
              className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-a:text-[#3b9fd8] prose-strong:text-white prose-p:text-gray-300 prose-li:text-gray-300"
              dangerouslySetInnerHTML={{ __html: newsletter.content }}
            />
          </div>

          {/* Navigation */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/newsletters"
              className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-xl font-semibold hover:border-[#3b9fd8]/50 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Toutes les newsletters
            </Link>
            <Link
              href="/newsletter"
              className="inline-flex items-center gap-2 bg-[#3b9fd8] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors"
            >
              <i className="fas fa-envelope"></i>
              S&apos;inscrire à la newsletter
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: NewsletterPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('title, excerpt, content, cover_image_url, created_at, updated_at')
    .eq('id', parseInt(id))
    .single()

  if (!newsletter) {
    return { title: 'Newsletter non trouvée' }
  }

  return generatePageMeta({
    title: newsletter.title,
    description: newsletter.excerpt || autoDescription(newsletter.content || ''),
    path: `/newsletters/${id}`,
    image: newsletter.cover_image_url || undefined,
    type: 'article',
    publishedTime: newsletter.created_at,
    modifiedTime: newsletter.updated_at || newsletter.created_at,
    keywords: ['newsletter', 'TLSTT', 'tennis de table', 'Toulon', 'La Seyne'],
  })
}
