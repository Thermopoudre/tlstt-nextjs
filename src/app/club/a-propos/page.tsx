import Link from 'next/link'
import { getGlobalSettings, getClubSettings } from '@/lib/settings'
import { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { organizationJsonLd, breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'À propos - Le Club TLSTT | Toulon La Seyne Tennis de Table',
  description: 'Découvrez le club de tennis de table TLSTT : son histoire depuis 1950, ses valeurs, ses équipements et ses chiffres clés. Club affilié FFTT dans le Var.',
  alternates: { canonical: `${SITE_URL}/club/a-propos` },
  openGraph: {
    title: 'À propos du TLSTT',
    description: 'Histoire, valeurs et équipements du club de tennis de table TLSTT à Toulon La Seyne-sur-Mer.',
    url: `${SITE_URL}/club/a-propos`,
  },
}

export default async function AProposPage() {
  const global = await getGlobalSettings()
  const club = await getClubSettings()

  const yearsExistence = global.foundation_year ? new Date().getFullYear() - global.foundation_year : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={[
        organizationJsonLd({
          name: global.site_name || undefined,
          description: global.club_description || undefined,
          email: global.contact_email || undefined,
          phone: global.contact_phone || undefined,
          address: global.address || undefined,
          city: global.city || undefined,
          postalCode: global.postal_code || undefined,
          foundingDate: global.foundation_year || undefined,
          facebook: global.facebook_url || undefined,
          instagram: global.instagram_url || undefined,
        }),
        breadcrumbJsonLd([
          { name: 'Accueil', url: '/' },
          { name: 'Club', url: '/club' },
          { name: 'À propos', url: '/club/a-propos' },
        ]),
      ]} />
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                À propos du <span className="text-[#3b9fd8]">{global.site_name}</span>
              </h1>
              <p className="text-gray-400 mt-1">
                Club affilié FFTT n°{global.club_number} — Depuis {global.foundation_year}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { value: `${yearsExistence}+`, label: "Années d'histoire", icon: 'fa-clock' },
            { value: `${global.nb_licencies}+`, label: 'Licenciés', icon: 'fa-users' },
            { value: global.nb_equipes, label: 'Équipes engagées', icon: 'fa-trophy' },
            { value: global.nb_entraineurs, label: 'Entraîneurs diplômés', icon: 'fa-chalkboard-teacher' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center hover:border-[#3b9fd8] transition-colors">
              <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className={`fas ${stat.icon} text-xl text-white`}></i>
              </div>
              <div className="text-3xl font-bold text-[#3b9fd8] mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Histoire + Palmarès */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 hover:border-[#3b9fd8]/40 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-history text-[#3b9fd8]"></i>
              Notre Histoire
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              {club.history ? (
                club.history.split('\n\n').map((paragraph, i) => (
                  <p key={i} dangerouslySetInnerHTML={{
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#3b9fd8]">$1</strong>')
                  }} />
                ))
              ) : (
                <p className="text-gray-500 italic">Histoire du club à renseigner dans le Back Office.</p>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#3b9fd8]/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-trophy text-[#3b9fd8]"></i>
              Palmarès
            </h2>
            {club.palmares && club.palmares.length > 0 ? (
              <ul className="space-y-4">
                {club.palmares.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <i className={`fas fa-${item.icon} text-${item.color === 'yellow' ? 'yellow-400' : item.color === 'gray' ? 'gray-400' : '[#3b9fd8]'} text-2xl mt-0.5 flex-shrink-0`}></i>
                    <div>
                      <h3 className="font-bold text-white">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Palmarès à renseigner dans le Back Office.</p>
            )}
            <div className="mt-6">
              <Link
                href="/palmares"
                className="inline-flex items-center gap-2 text-[#3b9fd8] hover:underline font-semibold text-sm"
              >
                <i className="fas fa-medal"></i>
                Voir le palmarès complet →
              </Link>
            </div>
          </div>
        </div>

        {/* Valeurs */}
        {club.values && club.values.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <i className="fas fa-heart text-[#3b9fd8]"></i>
              Nos Valeurs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {club.values.map((value, i) => (
                <div key={i} className="text-center p-6 bg-[#111] border border-[#2a2a2a] rounded-xl hover:border-[#3b9fd8]/40 transition-colors">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: value.color }}
                  >
                    <i className={`fas fa-${value.icon} text-2xl text-white`}></i>
                  </div>
                  <h3 className="font-bold text-white text-xl mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Équipements + Localisation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 hover:border-[#3b9fd8]/40 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-dumbbell text-[#3b9fd8]"></i>
              Nos Équipements
            </h2>
            {club.equipments && club.equipments.length > 0 ? (
              <ul className="space-y-3">
                {club.equipments.map((eq, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-400 text-lg flex-shrink-0"></i>
                    <span className="text-gray-300">{eq}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Équipements à renseigner dans le Back Office.</p>
            )}
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 hover:border-[#3b9fd8]/40 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#3b9fd8]"></i>
              Nous Trouver
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-building text-[#3b9fd8] text-lg mt-0.5 flex-shrink-0"></i>
                <div>
                  <p className="text-gray-300">{global.address}</p>
                  <p className="text-gray-400">{global.postal_code} {global.city}</p>
                </div>
              </div>
              {global.contact_email && (
                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-[#3b9fd8] text-lg flex-shrink-0"></i>
                  <a href={`mailto:${global.contact_email}`} className="text-gray-300 hover:text-[#3b9fd8] transition-colors">
                    {global.contact_email}
                  </a>
                </div>
              )}
              {global.contact_phone && (
                <div className="flex items-center gap-3">
                  <i className="fas fa-phone text-[#3b9fd8] text-lg flex-shrink-0"></i>
                  <a href={`tel:${global.contact_phone}`} className="text-gray-300 hover:text-[#3b9fd8] transition-colors">
                    {global.contact_phone}
                  </a>
                </div>
              )}
              {global.maps_url && (
                <a
                  href={global.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#3b9fd8] text-white rounded-lg hover:bg-[#2d8bc9] transition-colors text-sm font-semibold"
                >
                  <i className="fas fa-map-marker-alt"></i>
                  Voir sur Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#3b9fd8]/20 to-[#3b9fd8]/5 border border-[#3b9fd8]/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Prêt à nous rejoindre ?</h2>
          <p className="text-gray-400 mb-6">Première séance d&apos;essai gratuite, tous niveaux acceptés !</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/rejoindre"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3b9fd8] text-white rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
            >
              <i className="fas fa-table-tennis-paddle-ball"></i>
              Rejoindre le club
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors"
            >
              <i className="fas fa-envelope"></i>
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
