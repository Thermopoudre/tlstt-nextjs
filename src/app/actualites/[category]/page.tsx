import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

type NewsCategory = 'tt' | 'club' | 'handi'

interface NewsPageProps {
  params: Promise<{
    category: NewsCategory
  }>
}

const categoryTitles: Record<NewsCategory, string> = {
  tt: 'Actualités du Tennis de Table',
  club: 'Actualités du Club',
  handi: 'Handisport'
}

const categoryDescriptions: Record<NewsCategory, string> = {
  tt: 'Toutes les actualités du tennis de table professionnel et amateur',
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

  // Récupérer les flux RSS externes pour TT et Handi
  let rssItems: any[] = []
  if (category === 'tt') {
    try {
      const rssRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rss/fftt`, { 
        next: { revalidate: 3600 } 
      })
      const rssData = await rssRes.json()
      if (rssData.success) rssItems = rssData.items
    } catch (e) {
      console.error('Erreur RSS FFTT:', e)
    }
  } else if (category === 'handi') {
    try {
      const rssRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rss/handisport`, { 
        next: { revalidate: 3600 } 
      })
      const rssData = await rssRes.json()
      if (rssData.success) rssItems = rssData.items
    } catch (e) {
      console.error('Erreur RSS Handisport:', e)
    }
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

      {/* Flux RSS externes */}
      {rssItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-primary mb-6 border-b-2 border-primary pb-2">
            <i className="fas fa-rss mr-2"></i>
            Actualités {category === 'tt' ? 'FFTT' : 'Handisport France'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rssItems.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card hover:shadow-xl transition-all border-l-4 border-cyan-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-external-link-alt text-cyan-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.pubDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
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
