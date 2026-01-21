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
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Newsletters</h1>
          <p className="text-xl text-gray-200">
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
                className="card flex flex-col md:flex-row gap-6"
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
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(newsletter.published_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-primary mb-3">
                    {newsletter.title}
                  </h2>
                  {newsletter.excerpt && (
                    <p className="text-gray-600 mb-4">{newsletter.excerpt}</p>
                  )}
                  <Link
                    href={`/newsletters/${newsletter.id}`}
                    className="btn-primary inline-block"
                  >
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
        <div className="mt-12 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 rounded-xl">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              <i className="fas fa-bell mr-2"></i>
              Restez informé !
            </h3>
            <p className="text-gray-300 mb-6">
              Inscrivez-vous à notre newsletter pour recevoir les actualités du club
              directement dans votre boîte mail.
            </p>
            <Link href="/newsletter" className="btn-primary bg-white text-gray-900 hover:bg-gray-100">
              S'inscrire à la newsletter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
