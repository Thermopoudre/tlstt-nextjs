import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { articleJsonLd, breadcrumbJsonLd, autoDescription, autoKeywords, generatePageMeta } from '@/lib/seo'
import ArticleComments from '@/components/comments/ArticleComments'

type NewsCategory = 'tt' | 'club' | 'handi'

const categoryNames: Record<string, string> = {
  club: 'Club',
  tt: 'Tennis de Table',
  handi: 'Handisport',
}

interface ArticlePageProps {
  params: Promise<{
    category: NewsCategory
    id: string
  }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category, id } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('news')
    .select('title, content, excerpt, image_url, meta_title, meta_description, created_at, updated_at')
    .eq('id', id)
    .eq('category', category)
    .eq('status', 'published')
    .single()

  if (!article) {
    return { title: 'Article non trouvé' }
  }

  const metaTitle = article.meta_title || article.title
  const metaDesc = article.meta_description || article.excerpt || autoDescription(article.content || '')
  const keywords = autoKeywords(article.title, article.content || '')

  return generatePageMeta({
    title: metaTitle,
    description: metaDesc,
    path: `/actualites/${category}/${id}`,
    image: article.image_url || undefined,
    type: 'article',
    publishedTime: article.created_at,
    modifiedTime: article.updated_at || article.created_at,
    author: 'TLSTT',
    keywords,
  })
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, id } = await params
  const supabase = await createClient()

  // Récupérer l'article
  const { data: article, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .eq('category', category)
    .eq('status', 'published')
    .single()

  if (error || !article) {
    notFound()
  }

  // Récupérer les articles similaires
  const { data: relatedArticles } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .eq('status', 'published')
    .neq('id', id)
    .order('published_at', { ascending: false })
    .limit(3)

  const jsonLdData = [
    articleJsonLd({
      title: article.title,
      description: article.excerpt || autoDescription(article.content || ''),
      url: `/actualites/${category}/${id}`,
      image: article.image_url || undefined,
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.updated_at || article.created_at,
      category: categoryNames[category] || category,
    }),
    breadcrumbJsonLd([
      { name: 'Accueil', url: '/' },
      { name: `Actualités ${categoryNames[category] || ''}`, url: `/actualites/${category}` },
      { name: article.title, url: `/actualites/${category}/${id}` },
    ]),
  ]

  return (
    <div className="container-custom">
      <JsonLd data={jsonLdData} />
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
            <Link 
              href={`/actualites/${category}`}
              className="text-gray-600 hover:text-primary"
            >
              Actualités {category === 'tt' ? 'Tennis de Table' : category === 'club' ? 'Club' : 'Handisport'}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-semibold truncate max-w-xs">
            {article.title}
          </li>
        </ol>
      </nav>

      {/* Article Header */}
      <article className="card max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-2">
              <i className="fas fa-calendar-alt"></i>
              {new Date(article.published_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-user"></i>
              {article.author_id ? 'Admin TLSTT' : 'Rédaction'}
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-tag"></i>
              {category === 'tt' ? 'Tennis de Table' : category === 'club' ? 'Club' : 'Handisport'}
            </span>
          </div>

          {article.excerpt && (
            <p className="text-xl text-gray-700 font-medium leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Image principale */}
        {article.image_url && (
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Contenu de l'article */}
        <div 
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Link
            href={`/actualites/${category}`}
            className="btn-primary"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour aux actualités
          </Link>
          
          <div className="flex gap-2">
            <button className="btn-secondary">
              <i className="fab fa-facebook-f"></i>
            </button>
            <button className="btn-secondary">
              <i className="fab fa-twitter"></i>
            </button>
            <button className="btn-secondary">
              <i className="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
        {/* Commentaires */}
        <ArticleComments articleId={article.id} />
      </article>

      {/* Articles similaires */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-3xl font-bold text-primary mb-6">
            Articles similaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/actualites/${category}/${related.id}`}
                className="card group hover:scale-105 transition-transform duration-300"
              >
                {related.image_url && (
                  <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={related.image_url}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <h3 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2">
                  {related.title}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {new Date(related.published_at).toLocaleDateString('fr-FR')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
