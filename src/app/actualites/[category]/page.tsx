import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const categoryLabels: Record<string, string> = {
  club: 'Actualités du Club',
  tt: 'Tennis de Table',
  handi: 'Handisport',
}

const categoryDescriptions: Record<string, string> = {
  club: 'Les dernières nouvelles du club TLSTT',
  tt: 'Actualités du monde du tennis de table',
  handi: 'Sport adapté et handisport',
}

export default async function ActualitesPage({
  params,
}: {
  params: { category: string }
}) {
  const category = params.category
  const supabase = await createClient()

  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0f3057] py-12">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-400 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-newspaper text-4xl text-[#5bc0de]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {categoryLabels[category] || 'Actualités'}
              </h1>
              <p className="text-gray-300">
                {categoryDescriptions[category] || 'Toutes les actualités'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Categories tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Link
              key={key}
              href={`/actualites/${key}`}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                category === key
                  ? 'bg-[#5bc0de] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Articles grid */}
        {news && news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article) => (
              <Link
                key={article.id}
                href={`/actualites/${category}/${article.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                {article.image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#5bc0de] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {article.excerpt || article.content?.substring(0, 150)}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <i className="far fa-calendar"></i>
                      {new Date(article.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-[#5bc0de] font-medium">
                      Lire la suite <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <i className="fas fa-newspaper text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune actualité</h3>
            <p className="text-gray-500">Aucun article dans cette catégorie pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
