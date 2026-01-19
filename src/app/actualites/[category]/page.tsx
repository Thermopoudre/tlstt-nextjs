import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

type NewsCategory = 'ping' | 'club' | 'handi'

interface NewsPageProps {
  params: Promise<{
    category: NewsCategory
  }>
}

const categoryTitles: Record<NewsCategory, string> = {
  ping: 'Actualités du Ping',
  club: 'Actualités du Club',
  handi: 'Handisport'
}

const categoryDescriptions: Record<NewsCategory, string> = {
  ping: 'Toutes les actualités du tennis de table professionnel et amateur',
  club: 'Les dernières nouvelles du club TLSTT',
  handi: 'Actualités du tennis de table handisport'
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { category } = await params
  const supabase = await createClient()

  // Récupérer les actualités de la catégorie
  const { data: news, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Erreur Supabase:', error)
  }

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          {categoryTitles[category]}
        </h1>
        <p className="text-lg text-gray-600">
          {categoryDescriptions[category]}
        </p>
      </div>

      {/* Articles Grid */}
      {news && news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article) => (
            <Link
              key={article.id}
              href={`/actualites/${category}/${article.id}`}
              className="card group hover:scale-105 transition-transform duration-300"
            >
              {article.image_url && (
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-bold text-primary mb-2 group-hover:text-secondary transition-colors">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {new Date(article.published_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-secondary font-semibold group-hover:underline">
                    Lire la suite →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <i className="fas fa-newspaper text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">
            Aucune actualité pour le moment
          </h2>
          <p className="text-gray-500">
            Revenez bientôt pour découvrir les dernières nouvelles !
          </p>
        </div>
      )}

      {/* Pagination */}
      {news && news.length >= 20 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow-sm">
            <button className="btn-primary rounded-l-md">
              ← Précédent
            </button>
            <button className="btn-primary border-l border-gray-300">
              Page 1
            </button>
            <button className="btn-primary rounded-r-md border-l border-gray-300">
              Suivant →
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
