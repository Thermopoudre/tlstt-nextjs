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
import FadeInUp from '@/components/ui/FadeInUp'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

// Page d'accueil : revalider toutes les 30 min (actualités, carousel)
export const revalidate = 1800

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

export const metadata: Metadata = {
  title: 'TLSTT - Toulon La Seyne Tennis de Table | Club de Ping-Pong Var 83',
  description: 'Club de tennis de table à Toulon et La Seyne-sur-Mer. Entraînements, compétitions FFTT, handisport, école de ping pour tous niveaux. Plus de 70 ans d\'histoire sportive dans le Var.',
  keywords: ['TLSTT', 'tennis de table', 'ping-pong', 'Toulon', 'La Seyne-sur-Mer', 'Var', 'club sportif', 'FFTT', 'handisport'],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'TLSTT - Toulon La Seyne Tennis de Table',
    description: 'Club de tennis de table dans le Var. Rejoignez-nous pour des cours, des compétitions et du sport pour tous !',
    url: SITE_URL,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'TLSTT - Toulon La Seyne Tennis de Table' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TLSTT - Toulon La Seyne Tennis de Table',
    description: 'Club de tennis de table dans le Var. Rejoignez-nous pour des cours, des compétitions et du sport pour tous !',
    images: [`${SITE_URL}/og-image.png`],
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

  // Actualités : la vie du club d'un côté, l'actu nationale importée de l'autre,
  // sinon les articles écrits par le club sont noyés sous les imports quotidiens.
  const [{ data: clubNews }, { data: pingNews }] = await Promise.all([
    supabase
      .from('news')
      .select('*')
      .eq('status', 'published')
      .eq('category', 'club')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('news')
      .select('*')
      .eq('status', 'published')
      .in('category', ['tt', 'handi'])
      .order('created_at', { ascending: false })
      .limit(3),
  ])

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
    ? carouselSlides.map((slide) => ({
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

      {/* Les deux actions principales : s'inscrire et connaître les horaires.
          Placées juste sous le bandeau, ce sont les deux raisons pour lesquelles
          on arrive sur le site d'un club. */}
      <section className="py-8 sm:py-10 bg-[#0a0a0a] border-b border-[#1e1e1e]">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Link
              href="/rejoindre"
              className="group flex items-center gap-4 sm:gap-5 rounded-2xl bg-[#3b9fd8] p-5 sm:p-7 text-white shadow-lg shadow-[#3b9fd8]/20 transition-all hover:bg-[#2d8bc9] hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <i className="fas fa-user-plus text-xl sm:text-2xl"></i>
              </span>
              <span className="min-w-0">
                <span className="block text-lg sm:text-2xl font-extrabold leading-tight">Rejoindre le club</span>
                <span className="block text-sm sm:text-base text-white/85 mt-0.5">
                  Première séance d&apos;essai gratuite, à tout âge et à tout niveau
                </span>
              </span>
              <i className="fas fa-arrow-right ml-auto hidden sm:block text-xl opacity-70 transition-transform group-hover:translate-x-1"></i>
            </Link>

            <Link
              href="/planning"
              className="group flex items-center gap-4 sm:gap-5 rounded-2xl border border-[#3b9fd8]/40 bg-[#141414] p-5 sm:p-7 text-white transition-all hover:border-[#3b9fd8] hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#3b9fd8]/15">
                <i className="fas fa-clock text-xl sm:text-2xl text-[#3b9fd8]"></i>
              </span>
              <span className="min-w-0">
                <span className="block text-lg sm:text-2xl font-extrabold leading-tight">Horaires &amp; entraînements</span>
                <span className="block text-sm sm:text-base text-gray-400 mt-0.5">
                  Tous les créneaux de la semaine, à Toulon et à La Seyne
                </span>
              </span>
              <i className="fas fa-arrow-right ml-auto hidden sm:block text-xl text-[#3b9fd8]/70 transition-transform group-hover:translate-x-1"></i>
            </Link>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/tarifs" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
              <i className="fas fa-euro-sign mr-1.5 text-[#3b9fd8]"></i>Tarifs
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
              <i className="fas fa-envelope mr-1.5 text-[#3b9fd8]"></i>Nous contacter
            </Link>
            <Link href="/club/a-propos" className="text-gray-400 hover:text-[#3b9fd8] transition-colors">
              <i className="fas fa-circle-info mr-1.5 text-[#3b9fd8]"></i>Découvrir le club
            </Link>
          </div>
        </div>
      </section>

      {/* Les prochains créneaux */}
      <section className="py-12 sm:py-16 bg-[#111111]">
        <div className="container-custom">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                <i className="fas fa-calendar-check mr-3 text-[#3b9fd8]"></i>
                Les prochains créneaux
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Complexe Léry à La Seyne et École Val Fleuri à Toulon
              </p>
            </div>
            <Link href="/planning" className="text-gray-400 hover:text-[#3b9fd8] font-semibold transition-colors text-sm sm:text-base">
              Tout le planning →
            </Link>
          </div>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {nextTrainings && nextTrainings.length > 0 ? (
              nextTrainings.map((training) => {
                const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                return (
                  <StaggerItem key={training.id}>
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#3b9fd8] hover:shadow-xl hover:shadow-[#3b9fd8]/10">
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
                  </StaggerItem>
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
          </StaggerContainer>
          <div className="text-center mt-8">
            <Link href="/planning" className="inline-block bg-[#3b9fd8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
              <i className="fas fa-calendar-alt mr-2"></i>
              Voir tout le planning
            </Link>
          </div>
        </div>
      </section>

      {/* La vie du club : articles écrits par le club */}
      <section className="py-12 sm:py-16 bg-[#0a0a0a] border-t border-[#1e1e1e]">
        <div className="container-custom">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                <i className="fas fa-people-group mr-3 text-[#3b9fd8]"></i>
                La vie du club
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Tournois, résultats et événements du TLSTT
              </p>
            </div>
            <Link href="/actualites/club" className="text-gray-400 hover:text-[#3b9fd8] font-semibold transition-colors text-sm sm:text-base">
              Toutes les actus du club →
            </Link>
          </div>

          {clubNews && clubNews.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {clubNews.map((article) => (
                <StaggerItem key={article.id}>
                  <NewsCard article={article} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <i className="fas fa-newspaper text-4xl text-[#3b9fd8] mb-3"></i>
              <p className="text-gray-400">Aucune actualité du club pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* L'actu du ping : sélection nationale et internationale */}
      {pingNews && pingNews.length > 0 && (
        <section className="py-12 sm:py-16 bg-[#111111]">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  <i className="fas fa-globe mr-3 text-[#3b9fd8]"></i>
                  L&apos;actu du ping
                </h2>
                <p className="text-gray-400 text-sm sm:text-base mt-1">
                  L&apos;essentiel du tennis de table français et international
                </p>
              </div>
              <Link href="/actualites/tt" className="text-gray-400 hover:text-[#3b9fd8] font-semibold transition-colors text-sm sm:text-base">
                Toute l&apos;actu du ping →
              </Link>
            </div>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {pingNews.map((article) => (
                <StaggerItem key={article.id}>
                  <NewsCard article={article} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Le club en chiffres */}
      <section className="py-12 sm:py-14 bg-[#0a0a0a] border-t border-[#1e1e1e]">
        <div className="container-custom">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-center mb-8">
            <i className="fas fa-chart-simple mr-3 text-[#3b9fd8]"></i>
            Le club en chiffres
          </h2>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StaggerItem>
              <div className="group bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#3b9fd8] hover:shadow-xl hover:shadow-[#3b9fd8]/10">
                <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg shadow-[#3b9fd8]/30 transition-transform duration-300 group-hover:scale-110">
                  <i className="fas fa-users text-2xl text-white"></i>
                </div>
                <StatCounter value={totalPlayers} suffix="+" />
                <div className="text-sm text-[#3b9fd8]">Licenciés</div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#3b9fd8] hover:shadow-xl hover:shadow-[#3b9fd8]/10">
                <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg shadow-[#3b9fd8]/30 transition-transform duration-300 group-hover:scale-110">
                  <i className="fas fa-trophy text-2xl text-white"></i>
                </div>
                <StatCounter value={totalTeams} />
                <div className="text-sm text-[#3b9fd8]">Équipes</div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#3b9fd8] hover:shadow-xl hover:shadow-[#3b9fd8]/10">
                <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg shadow-[#3b9fd8]/30 transition-transform duration-300 group-hover:scale-110">
                  <i className="fas fa-calendar-alt text-2xl text-white"></i>
                </div>
                <StatCounter value={yearsOfHistory} suffix="+" />
                <div className="text-sm text-[#3b9fd8]">Ans d&apos;histoire</div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#3b9fd8] hover:shadow-xl hover:shadow-[#3b9fd8]/10">
                <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg shadow-[#3b9fd8]/30 transition-transform duration-300 group-hover:scale-110">
                  <i className="fas fa-images text-2xl text-white"></i>
                </div>
                <StatCounter value={totalAlbums} />
                <div className="text-sm text-[#3b9fd8]">Albums Photos</div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>


      {/* Infos pratiques + newsletter */}
      <section className="py-12 sm:py-16 bg-[#111111]">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FadeInUp>
              <div className="h-full bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#3b9fd8]/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-location-dot text-2xl sm:text-3xl text-[#3b9fd8]"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Où nous trouver</h3>
                    <ul className="text-gray-400 text-sm sm:text-base space-y-2">
                      {globalSettings.address && (
                        <li>
                          <i className="fas fa-map-pin mr-2 text-[#3b9fd8]"></i>
                          {globalSettings.address}
                          {globalSettings.postal_code ? `, ${globalSettings.postal_code}` : ''}
                          {globalSettings.city ? ` ${globalSettings.city}` : ''}
                        </li>
                      )}
                      {globalSettings.contact_phone && (
                        <li>
                          <i className="fas fa-phone mr-2 text-[#3b9fd8]"></i>
                          <a href={`tel:${globalSettings.contact_phone.replace(/\s/g, '')}`} className="hover:text-[#3b9fd8] transition-colors">
                            {globalSettings.contact_phone}
                          </a>
                        </li>
                      )}
                      {globalSettings.contact_email && (
                        <li className="truncate">
                          <i className="fas fa-envelope mr-2 text-[#3b9fd8]"></i>
                          <a href={`mailto:${globalSettings.contact_email}`} className="hover:text-[#3b9fd8] transition-colors">
                            {globalSettings.contact_email}
                          </a>
                        </li>
                      )}
                    </ul>
                    <div className="flex flex-wrap gap-3 mt-5">
                      <Link href="/contact" className="inline-block bg-[#3b9fd8] text-white px-5 sm:px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors text-sm sm:text-base">
                        <i className="fas fa-paper-plane mr-2"></i>Nous écrire
                      </Link>
                      <Link href="/planning" className="inline-block border border-[#3b9fd8]/60 text-[#3b9fd8] px-5 sm:px-6 py-3 rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors text-sm sm:text-base">
                        Voir les créneaux
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.15}>
              <div className="h-full bg-[#1a1a1a] border border-[#3b9fd8]/40 rounded-2xl text-white p-6 sm:p-8 hover:border-[#3b9fd8] transition-all">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#3b9fd8]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-envelope-open-text text-2xl sm:text-3xl text-[#3b9fd8]"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-[#3b9fd8]">Newsletter</h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-5 sm:mb-6">
                      Recevez les actualités du club : événements, résultats, nouveautés.
                    </p>
                    <Link href="/newsletter" className="inline-block border border-[#3b9fd8] text-[#3b9fd8] px-5 sm:px-6 py-3 rounded-full font-bold hover:bg-[#3b9fd8] hover:text-white transition-colors text-sm sm:text-base">
                      <i className="fas fa-paper-plane mr-2"></i>
                      S&apos;abonner
                    </Link>
                  </div>
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-12 sm:py-14 bg-[#0a0a0a] border-t border-[#1e1e1e]">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              <i className="fas fa-handshake mr-3 text-[#3b9fd8]"></i>
              Nos partenaires
            </h2>
            <p className="text-gray-500">Merci à nos partenaires pour leur soutien</p>
          </div>
          <StaggerContainer className="flex flex-wrap justify-center items-center gap-6">
            {partners && partners.length > 0 ? (
              partners.map((partner) => (
                <StaggerItem key={partner.id}>
                  <PartnerCard partner={partner} />
                </StaggerItem>
              ))
            ) : (
              <p className="text-gray-500">Partenaires à venir...</p>
            )}
          </StaggerContainer>
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
