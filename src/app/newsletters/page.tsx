import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Newsletters - Archives | TLSTT Tennis de Table',
  description: 'Retrouvez toutes les newsletters du club TLSTT Toulon La Seyne Tennis de Table. Actualités, résultats et informations du club.',
  alternates: { canonical: '/newsletters' },
  openGraph: {
    title: 'Newsletters TLSTT',
    description: 'Archives des newsletters du club de tennis de table TLSTT.',
    url: '/newsletters',
  },
}

export default async function NewslettersPage() {
  const supabase = await createClient()

  const { data: newsletters } = await supabase
    .from('newsletters')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <section className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-envelope-open-text text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nos <span className="text-[#3b9fd8]">Newsletters</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Retrouvez toutes les actualités du club dans nos newsletters mensuelles
            </p>
          </div>
        </div>
      </section>

      {/* Liste des newsletters */}
      <section className="py-16">
        <div className="container-custom">
          {newsletters && newsletters.length > 0 ? (
            <div className="grid gap-6">
              {newsletters.map((newsletter) => (
                <article
                  key={newsletter.id}
                  className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-[#3b9fd8]/60 transition-all"
                >
                  {newsletter.cover_image_url && (
                    <div className="md:w-1/4 flex-shrink-0">
                      <div className="relative h-48 md:h-full min-h-[140px] rounded-xl overflow-hidden">
                        <Image
                          src={newsletter.cover_image_url}
                          alt={newsletter.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>
                        <i className="fas fa-calendar mr-1 text-[#3b9fd8]"></i>
                        {new Date(newsletter.published_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">
                      {newsletter.title}
                    </h2>
                    {newsletter.excerpt && (
                      <p className="text-gray-400 mb-4 text-sm leading-relaxed">{newsletter.excerpt}</p>
                    )}
                    <Link
                      href={`/newsletters/${newsletter.id}`}
                      className="inline-flex items-center gap-2 bg-[#3b9fd8] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#2d8bc9] transition-colors text-sm"
                    >
                      <i className="fas fa-book-open"></i>
                      Lire la newsletter
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <i className="fas fa-envelope-open text-4xl mb-4 text-[#3b9fd8]"></i>
              <h2 className="text-xl font-bold text-white mb-2">Aucune newsletter</h2>
              <p>Les newsletters seront bientôt disponibles</p>
            </div>
          )}

          {/* CTA inscription newsletter */}
          <div className="mt-12 bg-gradient-to-r from-[#3b9fd8]/20 to-[#3b9fd8]/5 border border-[#3b9fd8]/30 rounded-2xl p-8 text-center">
            <i className="fas fa-bell text-3xl text-[#3b9fd8] mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-2">Restez informé !</h2>
            <p className="text-gray-400 mb-6">
              Inscrivez-vous à notre newsletter pour recevoir les actualités du club directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/newsletter"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3b9fd8] text-white rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
              >
                <i className="fas fa-envelope"></i>
                S&apos;inscrire à la newsletter
              </Link>
              <Link
                href="/actualites"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors"
              >
                <i className="fas fa-newspaper"></i>
                Voir les actualités
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
