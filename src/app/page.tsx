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

  // Images par défaut pour les actualités selon la catégorie
  const defaultNewsImages: { [key: string]: string } = {
    'club': 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=800&q=80',
    'tt': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'handisport': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80'
  }

  return (
    <div>
      {/* Hero Carousel Section */}
      <HeroCarousel images={carouselImages} />

      {/* Stats Section - Bleu marine uni */}
      <section className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-users text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{totalPlayers || 200}+</div>
              <div className="text-sm text-[#5bc0de]">Licenciés</div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-trophy text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">12</div>
              <div className="text-sm text-[#5bc0de]">Équipes</div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-calendar-alt text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">70+</div>
              <div className="text-sm text-[#5bc0de]">Ans d'histoire</div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 bg-[#5bc0de] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-images text-2xl text-white"></i>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{totalAlbums || 3}</div>
              <div className="text-sm text-[#5bc0de]">Albums Photos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dernières actualités */}
      <section className="py-16 container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-[#0f3057]">
            <i className="fas fa-newspaper mr-3 text-[#5bc0de]"></i>
            Dernières Actualités
          </h2>
          <Link href="/actualites/club" className="text-[#1a5a8a] hover:text-[#5bc0de] font-semibold transition-colors">
            Voir toutes les actualités →
          </Link>
        </div>

        {latestNews && latestNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((article: any) => {
              const imageUrl = article.photo_url || defaultNewsImages[article.category] || defaultNewsImages['default']
              return (
                <Link
                  key={article.id}
                  href={`/actualites/${article.category}/${article.id}`}
                  className="card group hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-48 bg-[#1a5a8a] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultNewsImages['default']
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#5bc0de] text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <i className="fas fa-calendar text-[#5bc0de]"></i>
                      <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#0f3057] mb-2 line-clamp-2 group-hover:text-[#5bc0de] transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    <span className="text-[#5bc0de] font-semibold text-sm flex items-center gap-1">
                      Lire la suite
                      <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#e8f4f8] rounded-xl border border-[#5bc0de]/30">
            <i className="fas fa-newspaper text-4xl text-[#5bc0de] mb-3"></i>
            <p className="text-[#1a5a8a]">Aucune actualité pour le moment</p>
          </div>
        )}
      </section>

      {/* Prochains entraînements - Bleu moyen uni */}
      <section className="py-16 bg-[#1a5a8a]">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-white mb-8">
            <i className="fas fa-calendar-check mr-3 text-[#5bc0de]"></i>
            Prochains Entraînements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nextTrainings && nextTrainings.length > 0 ? (
              nextTrainings.map((training: any) => {
                const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                return (
                  <div key={training.id} className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#5bc0de] rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-table-tennis text-2xl text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">{training.activity_name}</h3>
                        <div className="text-sm text-white/80 space-y-1">
                          <p><i className="fas fa-calendar mr-2 text-[#5bc0de]"></i>{days[training.day_of_week]}</p>
                          <p><i className="fas fa-clock mr-2 text-[#5bc0de]"></i>{training.start_time?.slice(0, 5)} - {training.end_time?.slice(0, 5)}</p>
                          {training.level && (
                            <p><i className="fas fa-user mr-2 text-[#5bc0de]"></i>{training.level}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <>
                <div className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#5bc0de] rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-table-tennis text-2xl text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-2">École de Ping</h3>
                      <div className="text-sm text-white/80 space-y-1">
                        <p><i className="fas fa-calendar mr-2 text-[#5bc0de]"></i>Mercredi</p>
                        <p><i className="fas fa-clock mr-2 text-[#5bc0de]"></i>14:00 - 16:00</p>
                        <p><i className="fas fa-user mr-2 text-[#5bc0de]"></i>Débutants</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#5bc0de] rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-table-tennis text-2xl text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-2">Jeunes Perfectionnement</h3>
                      <div className="text-sm text-white/80 space-y-1">
                        <p><i className="fas fa-calendar mr-2 text-[#5bc0de]"></i>Mercredi</p>
                        <p><i className="fas fa-clock mr-2 text-[#5bc0de]"></i>16:00 - 18:00</p>
                        <p><i className="fas fa-user mr-2 text-[#5bc0de]"></i>Intermédiaire</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#5bc0de] rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-table-tennis text-2xl text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-2">Loisirs</h3>
                      <div className="text-sm text-white/80 space-y-1">
                        <p><i className="fas fa-calendar mr-2 text-[#5bc0de]"></i>Mercredi</p>
                        <p><i className="fas fa-clock mr-2 text-[#5bc0de]"></i>18:00 - 20:00</p>
                        <p><i className="fas fa-user mr-2 text-[#5bc0de]"></i>Débutants</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/planning" className="inline-block bg-[#5bc0de] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4ab0ce] transition-colors">
              <i className="fas fa-calendar-alt mr-2"></i>
              Voir tout le planning
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f3057] rounded-2xl text-white p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-[#5bc0de] rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user-plus text-3xl text-white"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-[#5bc0de]">Nous Rejoindre</h3>
                <p className="text-white/90 mb-6">
                  Que vous soyez débutant ou confirmé, le TLSTT vous accueille toute l'année.
                  Première séance d'essai gratuite !
                </p>
                <Link href="/contact" className="inline-block bg-[#5bc0de] text-white px-6 py-3 rounded-full font-bold hover:bg-[#4ab0ce] transition-colors">
                  <i className="fas fa-envelope mr-2"></i>
                  S'inscrire
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-[#1a5a8a] rounded-2xl text-white p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-[#5bc0de] rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-envelope-open-text text-3xl text-white"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-[#5bc0de]">Newsletter</h3>
                <p className="text-white/90 mb-6">
                  Restez informé de toutes les actualités du club : événements, résultats, nouveautés...
                </p>
                <Link href="/newsletter" className="inline-block bg-[#5bc0de] text-white px-6 py-3 rounded-full font-bold hover:bg-[#4ab0ce] transition-colors">
                  <i className="fas fa-paper-plane mr-2"></i>
                  S'abonner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-12 bg-[#e8f4f8]">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0f3057] mb-2">
              <i className="fas fa-handshake mr-3 text-[#5bc0de]"></i>
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
                  className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center min-w-[150px] h-20"
                  title={partner.name}
                >
                  {partner.logo_url ? (
                    <img 
                      src={partner.logo_url} 
                      alt={partner.name} 
                      className="max-h-12 max-w-[120px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <span className={`font-bold text-[#0f3057] text-center ${partner.logo_url ? 'hidden' : ''}`}>
                    {partner.name}
                  </span>
                </a>
              ))
            ) : (
              /* Partenaires par défaut avec logos fonctionnels */
              <>
                <a href="https://www.la-seyne.fr" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="h-12 w-32 flex items-center justify-center">
                    <span className="font-bold text-[#0f3057] text-sm text-center">Ville de La Seyne</span>
                  </div>
                </a>
                <a href="https://www.toulon.fr" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="h-12 w-32 flex items-center justify-center">
                    <span className="font-bold text-[#0f3057] text-sm text-center">Ville de Toulon</span>
                  </div>
                </a>
                <a href="https://www.var.fr" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="h-12 w-32 flex items-center justify-center">
                    <span className="font-bold text-[#0f3057] text-sm text-center">Département du Var</span>
                  </div>
                </a>
                <a href="https://www.maregionsud.fr" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="h-12 w-32 flex items-center justify-center">
                    <span className="font-bold text-[#0f3057] text-sm text-center">Région Sud</span>
                  </div>
                </a>
                <a href="https://www.fftt.com" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="h-12 w-32 flex items-center justify-center">
                    <span className="font-bold text-[#0f3057] text-sm text-center">FFTT</span>
                  </div>
                </a>
              </>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/partenaires" className="text-[#1a5a8a] hover:text-[#5bc0de] font-semibold transition-colors">
              Voir tous nos partenaires →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
