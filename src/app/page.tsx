import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import HeroCarousel from '@/components/HeroCarousel'

export default async function HomePage() {
  const supabase = await createClient()

  // Récupérer les slides du carrousel depuis la base de données
  const { data: carouselSlides } = await supabase
    .from('carousel_slides')
    .select('*')
    .eq('is_active', true)
    .order('position')

  // Récupérer les dernières actualités
  const { data: latestNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3)

  // Récupérer les statistiques
  const [
    { count: totalPlayers },
    { count: totalNews },
    { count: totalAlbums },
  ] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }).ilike('admin_notes', '%TLSTT%'),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('albums').select('*', { count: 'exact', head: true }),
  ])

  // Récupérer les prochains entraînements
  const { data: nextTrainings } = await supabase
    .from('trainings')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')
    .limit(3)

  // Récupérer les partenaires
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('position')

  // Transformer les données du carrousel pour le composant
  const carouselImages = carouselSlides && carouselSlides.length > 0 
    ? carouselSlides.map((slide: any) => ({
        url: slide.image_url || 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1920&q=80',
        title: slide.title,
        subtitle: slide.subtitle || slide.description,
        buttonText: slide.button_text,
        buttonLink: slide.button_link
      }))
    : [
        {
          url: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1920&q=80',
          title: 'Bienvenue au TLSTT',
          subtitle: 'Club de Tennis de Table de Toulon La Seyne',
          buttonText: 'Découvrir',
          buttonLink: '/club'
        }
      ]

  return (
    <div>
      {/* Hero Carousel Section */}
      <HeroCarousel images={carouselImages} />

      {/* Stats Section - FOND BLEU */}
      <section className="py-12 bg-gradient-to-r from-primary to-blue-800">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-users text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{totalPlayers || 200}+</div>
              <div className="text-sm text-cyan-200">Licenciés</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-trophy text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">12</div>
              <div className="text-sm text-cyan-200">Équipes</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-calendar-alt text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">70+</div>
              <div className="text-sm text-cyan-200">Ans d'histoire</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-images text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{totalAlbums || 3}</div>
              <div className="text-sm text-cyan-200">Albums Photos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dernières actualités */}
      <section className="py-16 container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-primary">
            <i className="fas fa-newspaper mr-3 text-cyan-500"></i>
            Dernières Actualités
          </h2>
          <Link href="/actualites/club" className="text-cyan-600 hover:underline font-semibold">
            Voir toutes les actualités →
          </Link>
        </div>

        {latestNews && latestNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((article: any) => (
              <Link
                key={article.id}
                href={`/actualites/${article.category}/${article.id}`}
                className="card group hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                {article.photo_url && (
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <Image
                      src={article.photo_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                      {article.category}
                    </span>
                    <span>•</span>
                    <span>{new Date(article.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                      {article.excerpt}
                    </p>
                  )}
                  <span className="text-cyan-600 font-semibold text-sm flex items-center gap-1">
                    Lire la suite
                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-blue-50 rounded-xl border border-blue-100">
            <i className="fas fa-newspaper text-4xl text-blue-300 mb-3"></i>
            <p className="text-blue-600">Aucune actualité pour le moment</p>
          </div>
        )}
      </section>

      {/* Prochains entraînements - FOND BLEU */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-primary">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-cyan-300 mb-8">
            <i className="fas fa-calendar-check mr-3"></i>
            Prochains Entraînements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nextTrainings && nextTrainings.length > 0 ? (
              nextTrainings.map((training: any) => {
                const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                return (
                  <div key={training.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-table-tennis text-2xl text-cyan-300"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-cyan-200 mb-2">{training.activity_name}</h3>
                        <div className="text-sm text-white/80 space-y-1">
                          <p><i className="fas fa-calendar mr-2 text-cyan-300"></i>{days[training.day_of_week]}</p>
                          <p><i className="fas fa-clock mr-2 text-cyan-300"></i>{training.start_time?.slice(0, 5)} - {training.end_time?.slice(0, 5)}</p>
                          {training.level && (
                            <p><i className="fas fa-user mr-2 text-cyan-300"></i>{training.level}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-table-tennis text-2xl text-cyan-300"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-cyan-200 mb-2">École de Ping</h3>
                      <div className="text-sm text-white/80 space-y-1">
                        <p><i className="fas fa-calendar mr-2 text-cyan-300"></i>Mercredi</p>
                        <p><i className="fas fa-clock mr-2 text-cyan-300"></i>14:00 - 16:00</p>
                        <p><i className="fas fa-user mr-2 text-cyan-300"></i>Débutants</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-table-tennis text-2xl text-cyan-300"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-cyan-200 mb-2">Jeunes Perfectionnement</h3>
                      <div className="text-sm text-white/80 space-y-1">
                        <p><i className="fas fa-calendar mr-2 text-cyan-300"></i>Mercredi</p>
                        <p><i className="fas fa-clock mr-2 text-cyan-300"></i>16:00 - 18:00</p>
                        <p><i className="fas fa-user mr-2 text-cyan-300"></i>Intermédiaire</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-table-tennis text-2xl text-cyan-300"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-cyan-200 mb-2">Loisirs</h3>
                      <div className="text-sm text-white/80 space-y-1">
                        <p><i className="fas fa-calendar mr-2 text-cyan-300"></i>Mercredi</p>
                        <p><i className="fas fa-clock mr-2 text-cyan-300"></i>18:00 - 20:00</p>
                        <p><i className="fas fa-user mr-2 text-cyan-300"></i>Débutants</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/planning" className="inline-block bg-cyan-400 text-primary px-8 py-3 rounded-full font-bold hover:bg-cyan-300 transition-colors">
              <i className="fas fa-calendar-alt mr-2"></i>
              Voir tout le planning
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - FOND BLEU */}
      <section className="py-16 container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl text-white p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user-plus text-3xl text-cyan-300"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-cyan-200">Nous Rejoindre</h3>
                <p className="text-white/80 mb-6">
                  Que vous soyez débutant ou confirmé, le TLSTT vous accueille toute l'année.
                  Première séance d'essai gratuite !
                </p>
                <Link href="/contact" className="inline-block bg-cyan-400 text-primary px-6 py-3 rounded-full font-bold hover:bg-cyan-300 transition-colors">
                  <i className="fas fa-envelope mr-2"></i>
                  S'inscrire
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl text-white p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-envelope-open-text text-3xl text-cyan-300"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-cyan-200">Newsletter</h3>
                <p className="text-white/80 mb-6">
                  Restez informé de toutes les actualités du club : événements, résultats, nouveautés...
                </p>
                <Link href="/newsletter" className="inline-block bg-cyan-400 text-primary px-6 py-3 rounded-full font-bold hover:bg-cyan-300 transition-colors">
                  <i className="fas fa-paper-plane mr-2"></i>
                  S'abonner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">
              <i className="fas fa-handshake mr-3 text-cyan-500"></i>
              Nos Partenaires
            </h2>
            <p className="text-gray-600">Merci à nos partenaires pour leur soutien</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {partners && partners.length > 0 ? (
              partners.map((partner: any) => (
                <a
                  key={partner.id}
                  href={partner.website_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
                  title={partner.name}
                >
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="h-16 w-auto object-contain" />
                  ) : (
                    <div className="h-16 px-6 bg-white rounded-lg shadow flex items-center justify-center">
                      <span className="font-bold text-gray-600">{partner.name}</span>
                    </div>
                  )}
                </a>
              ))
            ) : (
              <p className="text-gray-500">Partenaires à venir...</p>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/partenaires" className="text-cyan-600 hover:underline font-semibold">
              Voir tous nos partenaires →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
