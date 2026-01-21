import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = {
  title: 'Newsletters | TLSTT',
  description: 'Retrouvez toutes les newsletters du club Toulon La Seyne Tennis de Table',
}

export default async function NewslettersPage() {
  const supabase = await createClient()

  const { data: newsletters } = await supabase
    .from('newsletters')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#0f3057] py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-envelope-open-text mr-3 text-[#5bc0de]"></i>
            Newsletters
          </h1>
          <p className="text-xl text-white/80">
            Retrouvez toutes les actualités du club dans nos newsletters mensuelles
          </p>
        </div>
      </div>

      {/* Liste des newsletters */}
      <div className="container-custom py-12">
        {newsletters && newsletters.length > 0 ? (
          <div className="grid gap-8">
            {newsletters.map((newsletter) => (
              <article
                key={newsletter.id}
                className="card flex flex-col md:flex-row gap-6 hover:border-[#5bc0de] transition-colors"
              >
                {newsletter.cover_image_url && (
                  <div className="md:w-1/3">
                    <img
                      src={newsletter.cover_image_url}
                      alt={newsletter.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span>
                      <i className="fas fa-calendar mr-1 text-[#5bc0de]"></i>
                      {new Date(newsletter.published_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0f3057] mb-3">
                    {newsletter.title}
                  </h2>
                  {newsletter.excerpt && (
                    <p className="text-gray-600 mb-4">{newsletter.excerpt}</p>
                  )}
                  <Link
                    href={`/newsletters/${newsletter.id}`}
                    className="inline-block bg-[#5bc0de] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#4ab0ce] transition-colors"
                  >
                    <i className="fas fa-book-open mr-2"></i>
                    Lire la newsletter
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-envelope-open text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-600">Aucune newsletter</h2>
            <p className="text-gray-500">Les newsletters seront bientôt disponibles</p>
          </div>
        )}

        {/* Inscription newsletter */}
        <div className="mt-12 bg-[#0f3057] text-white p-8 rounded-xl">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              <i className="fas fa-bell mr-2 text-[#5bc0de]"></i>
              Restez informé !
            </h3>
            <p className="text-white/80 mb-6">
              Inscrivez-vous à notre newsletter pour recevoir les actualités du club
              directement dans votre boîte mail.
            </p>
            <Link href="/newsletter" className="inline-block bg-[#5bc0de] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4ab0ce] transition-colors">
              <i className="fas fa-envelope mr-2"></i>
              S'inscrire à la newsletter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
