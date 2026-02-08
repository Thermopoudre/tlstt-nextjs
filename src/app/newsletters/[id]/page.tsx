import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { articleJsonLd, breadcrumbJsonLd, autoDescription, generatePageMeta } from '@/lib/seo'

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
    <div className="min-h-screen">
      <JsonLd data={jsonLdData} />
      {/* Hero */}
      <div
        className="relative h-[40vh] bg-cover bg-center"
        style={{
          backgroundImage: newsletter.cover_image_url
            ? `url(${newsletter.cover_image_url})`
            : 'linear-gradient(to right, #10325F, #1a4a7a)',
        }}
      >
        <div className="absolute inset-0 bg-primary/70"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="container-custom text-white">
            <Link href="/newsletters" className="text-gray-300 hover:text-white mb-4 inline-block">
              ← Retour aux newsletters
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{newsletter.title}</h1>
            <div className="flex items-center gap-4 text-gray-200">
              <span>
                <i className="fas fa-calendar mr-2"></i>
                {new Date(newsletter.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container-custom py-12">
        <article className="max-w-3xl mx-auto">
          <div
            className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-secondary"
            dangerouslySetInnerHTML={{ __html: newsletter.content }}
          />
        </article>

        {/* Navigation */}
        <div className="max-w-3xl mx-auto mt-12 pt-8 border-t">
          <div className="flex items-center justify-between">
            <Link href="/newsletters" className="text-primary hover:underline">
              ← Toutes les newsletters
            </Link>
            <Link href="/newsletter" className="btn-primary">
              S'inscrire à la newsletter
            </Link>
          </div>
        </div>
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
