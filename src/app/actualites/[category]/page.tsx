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
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const supabase = await createClient()

  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-newspaper text-4xl text-[#3b9fd8]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {categoryLabels[category] || 'Actualites'}
              </h1>
              <p className="text-gray-400">
                {categoryDescriptions[category] || 'Toutes les actualites'}
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
                  ? 'bg-[#3b9fd8] text-white'
                  : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-[#222]'
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
                className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-1 group"
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
                  <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#3b9fd8] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                    {article.excerpt || article.content?.substring(0, 150)}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <i className="far fa-calendar"></i>
                      {new Date(article.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-[#3b9fd8] font-medium">
                      Lire la suite <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-12 text-center">
            <i className="fas fa-newspaper text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">Aucune actualite</h3>
            <p className="text-gray-500">Aucun article dans cette categorie pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
