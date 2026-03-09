import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeroCarousel from '@/components/HeroCarousel'
import NewsCard from '@/components/NewsCard'
import PartnerCard from '@/components/PartnerCard'
import LabelsSection from '@/components/home/LabelsSection'
import StatCounter from '@/components/home/StatCounter'
import { getGlobalSettings } from '@/lib/settings'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, organizationJsonLd } from '@/lib/seo'

// Page d'accueil : revalider toutes les 30 min (actualités, carousel)
export const revalidate = 1800

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'TLSTT - Toulon La Seyne Tennis de Table | Club de Ping-Pong Var 83',
  description: 'Club de tennis de table à Toulon et La Seyne-sur-Mer. Entraînements, compétitions FFTT, handisport, école de ping pour tous niveaux. Plus de 70 ans d\'histoire sportive dans le Var.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'TLSTT - Toulon La Seyne Tennis de Table',
    description: 'Club de tennis de table dans le Var. Rejoignez-nous pour des cours, des compétitions et du sport pour tous !',
    url: SITE_URL,
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const globalSettings = await getGlobalSettings()
  const yearsOfHistory = globalSettings.foundation_year ? new Date().getFullYear() - globalSettings.foundation_year : null

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
    { count: totalTeams },
  ] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }).ilike('admin_notes', '%TLSTT%'),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('albums').select('*', { count: 'exact', head: true }),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('is_active', true),
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
    <div className="bg-[#0a0a0a]">
      <JsonLd data={[
        organizationJsonLd({
          name: globalSettings.site_name || undefined,
          description: globalSettings.club_description || undefined,
          email: globalSettings.contact_email || undefined,
          phone: globalSettings.contact_phone || undefined,
          address: globalSettings.address || undefined,
          city: globalSettings.city || undefined,
          postalCode: globalSettings.postal_code || undefined,
          foundingDate: globalSettings.foundation_year || undefined,
          facebook: globalSettings.facebook_url || undefined,
          instagram: globalSettings.instagram_url || undefined,
        }),
        breadcrumbJsonLd([
          { name: 'Accueil', url: '/' },
        ]),
      ]} />
      {/* Hero Carousel Section */}
      <HeroCarousel images={carouselImages} />

      {/* Stats Section - Noir avec bordures bleu */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center hover:border-[#3b9fd8] transition-colors">
              <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-users text-2xl text-white"></i>
              </div>
              <StatCounter value={totalPlayers} suffix="+" />
              <div className="text-sm text-[#3b9fd8]">Licenciés</div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center hover:border-[#3b9fd8] transition-colors">
              <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-trophy text-2xl text-white"></i>
              </div>
              <StatCounter value={totalTeams} />
              <div className="text-sm text-[#3b9fd8]">Équipes</div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center hover:border-[#3b9fd8] transition-colors">
              <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-calendar-alt text-2xl text-white"></i>
              </div>
              <StatCounter value={yearsOfHistory} suffix="+" />
              <div className="text-sm text-[#3b9fd8]">Ans d&apos;histoire</div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center hover:border-[#3b9fd8] transition-colors">
              <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-images text-2xl text-white"></i>
              </div>
              <StatCounter value={totalAlbums} />
              <div className="text-sm text-[#3b9fd8]">Albums Photos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dernières actualités - Fond gris foncé */}
      <section className="py-16 bg-[#111111]">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              <i className="fas fa-newspaper mr-3 text-[#3b9fd8]"></i>
              Dernières Actualités
            </h2>
            <Link href="/actualites/club" className="text-gray-400 hover:text-[#3b9fd8] font-semibold transition-colors">
              Voir toutes les actualités →
            </Link>
          </div>

          {latestNews && latestNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestNews.map((article: any) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <i className="fas fa-newspaper text-4xl text-[#3b9fd8] mb-3"></i>
              <p className="text-gray-400">Aucune actualité pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Prochains entraînements - Fond noir */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-white mb-8">
            <i className="fas fa-calendar-check mr-3 text-[#3b9fd8]"></i>
            Prochains Entraînements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nextTrainings && nextTrainings.length > 0 ? (
              nextTrainings.map((training: any) => {
                const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                return (
                  <div key={training.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-table-tennis text-2xl text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">{training.activity_name}</h3>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p><i className="fas fa-calendar mr-2 text-[#3b9fd8]"></i>{days[training.day_of_week]}</p>
                          <p><i className="fas fa-clock mr-2 text-[#3b9fd8]"></i>{training.start_time?.slice(0, 5)} - {training.end_time?.slice(0, 5)}</p>
                          {training.level && (
                            <p><i className="fas fa-user mr-2 text-[#3b9fd8]"></i>{training.level}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-3 text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <i className="fas fa-calendar-alt text-4xl text-[#3b9fd8] mb-3"></i>
                <p className="text-gray-400 mb-4">Planning d&apos;entraînement à venir</p>
                <Link href="/planning" className="text-[#3b9fd8] hover:underline text-sm font-semibold">
                  Voir le planning complet →
                </Link>
              </div>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/planning" className="inline-block bg-[#3b9fd8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
              <i className="fas fa-calendar-alt mr-2"></i>
              Voir tout le planning
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Fond gris foncé */}
      <section className="py-16 bg-[#111111]">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#3b9fd8] rounded-2xl text-white p-8 hover:bg-[#2d8bc9] transition-all shadow-lg shadow-[#3b9fd8]/20">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user-plus text-3xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Nous Rejoindre</h3>
                  <p className="text-white/80 mb-4">
                    Que vous soyez débutant ou confirmé, le TLSTT vous accueille toute l&apos;année.
                    Première séance d&apos;essai <strong>gratuite</strong> !
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/rejoindre" className="inline-block bg-white text-[#3b9fd8] px-6 py-3 rounded-full font-bold hover:bg-white/90 transition-colors">
                      <i className="fas fa-table-tennis-paddle-ball mr-2"></i>
                      Nous rejoindre
                    </Link>
                    <Link href="/tarifs" className="inline-block border border-white/60 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
                      Voir les tarifs
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#3b9fd8]/40 rounded-2xl text-white p-8 hover:border-[#3b9fd8] transition-all">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-[#3b9fd8]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-envelope-open-text text-3xl text-[#3b9fd8]"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-[#3b9fd8]">Newsletter</h3>
                  <p className="text-gray-400 mb-6">
                    Restez informé de toutes les actualités du club : événements, résultats, nouveautés...
                  </p>
                  <Link href="/newsletter" className="inline-block border border-[#3b9fd8] text-[#3b9fd8] px-6 py-3 rounded-full font-bold hover:bg-[#3b9fd8] hover:text-white transition-colors">
                    <i className="fas fa-paper-plane mr-2"></i>
                    S&apos;abonner
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires - Fond noir */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              <i className="fas fa-handshake mr-3 text-[#3b9fd8]"></i>
              Nos Partenaires
            </h2>
            <p className="text-gray-500">Merci à nos partenaires pour leur soutien</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {partners && partners.length > 0 ? (
              partners.map((partner: any) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))
            ) : (
              <p className="text-gray-500">Partenaires à venir...</p>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/partenaires" className="text-gray-400 hover:text-[#3b9fd8] font-semibold transition-colors">
              Voir tous nos partenaires →
            </Link>
          </div>
        </div>
      </section>

      {/* Section Labels FFTT */}
      <LabelsSection />
    </div>
  )
}
