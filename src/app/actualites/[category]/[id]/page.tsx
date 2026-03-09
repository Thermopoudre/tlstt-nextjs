import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { articleJsonLd, breadcrumbJsonLd, autoDescription, autoKeywords, generatePageMeta } from '@/lib/seo'
import ArticleComments from '@/components/comments/ArticleComments'
import LikeButton from '@/components/ui/LikeButton'

export const revalidate = 3600

type NewsCategory = 'tt' | 'club' | 'handi'

const categoryNames: Record<string, string> = {
  club: 'Club',
  tt: 'Tennis de Table',
  handi: 'Handisport',
}

const categoryIcons: Record<string, string> = {
  club: 'fa-users',
  tt: 'fa-table-tennis-paddle-ball',
  handi: 'fa-wheelchair',
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={jsonLdData} />

      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className={`fas ${categoryIcons[category] || 'fa-newspaper'} text-2xl text-white`}></i>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{article.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>
                    <i className="fas fa-calendar mr-1 text-[#3b9fd8]"></i>
                    {new Date(article.published_at || article.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>
                    <i className="fas fa-user mr-1 text-[#3b9fd8]"></i>
                    {article.author_id ? 'Admin TLSTT' : 'Rédaction'}
                  </span>
                  <span className="bg-[#3b9fd8]/10 text-[#3b9fd8] text-xs px-3 py-1 rounded-full border border-[#3b9fd8]/30">
                    <i className="fas fa-tag mr-1"></i>
                    {categoryNames[category] || category}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/actualites/${category}`}
              className="bg-[#1a1a1a] border border-[#333] text-white px-5 py-2.5 rounded-xl font-semibold hover:border-[#3b9fd8]/50 transition-colors flex-shrink-0"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour aux actualités
            </Link>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container-custom py-12">
        <article className="max-w-3xl mx-auto">
          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-300 font-medium leading-relaxed mb-8 border-l-4 border-[#3b9fd8] pl-6">
              {article.excerpt}
            </p>
          )}

          {/* Image principale */}
          {article.image_url && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-8">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Corps de l'article */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8">
            <div
              className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-a:text-[#3b9fd8] prose-strong:text-white prose-p:text-gray-300 prose-li:text-gray-300"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href={`/actualites/${category}`}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-xl font-semibold hover:border-[#3b9fd8]/50 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Toutes les actualités
            </Link>
            <div className="flex items-center gap-3">
              <LikeButton newsId={article.id} />
              <span className="text-gray-500 text-sm mr-1">Partager :</span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://tlstt-nextjs.vercel.app/actualites/${category}/${id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-[#3b9fd8]/50 transition-colors"
                aria-label="Partager sur Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://tlstt-nextjs.vercel.app/actualites/${category}/${id}`)}&text=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-[#3b9fd8]/50 transition-colors"
                aria-label="Partager sur Twitter"
              >
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>

          {/* Commentaires */}
          <ArticleComments articleId={article.id} />
        </article>

        {/* Articles similaires */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              <i className="fas fa-newspaper mr-2 text-[#3b9fd8]"></i>
              Articles similaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/actualites/${category}/${related.id}`}
                  className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-1 group"
                >
                  {related.image_url && (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={related.image_url}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#3b9fd8] transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      <i className="far fa-calendar mr-1"></i>
                      {new Date(related.published_at || related.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
