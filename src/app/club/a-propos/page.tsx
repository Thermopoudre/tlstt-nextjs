import Link from 'next/link'
import { getGlobalSettings, getClubSettings } from '@/lib/settings'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'À propos - Le Club TLSTT',
  description: 'Découvrez le club de tennis de table TLSTT, son histoire, ses valeurs et ses équipements.',
}

export default async function AProposPage() {
  const global = await getGlobalSettings()
  const club = await getClubSettings()

  const yearsExistence = new Date().getFullYear() - global.foundation_year

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li><Link href="/club" className="hover:text-[#5bc0de]">Le Club</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">À propos</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-[#5bc0de]">{global.site_name}</span> - {global.site_description}
            </h1>
            <p className="text-white/70 text-lg">
              Club affilié FFTT n°{global.club_number} - Depuis {global.foundation_year}
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {/* Présentation + Palmarès */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-history mr-2 text-[#5bc0de]"></i>
              Notre Histoire
            </h2>
            <div className="space-y-4 text-white/80">
              {club.history ? (
                club.history.split('\n\n').map((paragraph, i) => (
                  <p key={i} dangerouslySetInnerHTML={{
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#5bc0de]">$1</strong>')
                  }} />
                ))
              ) : (
                <p>Histoire du club à renseigner dans le Back Office.</p>
              )}
            </div>
          </div>

          <div className="bg-[#5bc0de]/20 border border-[#5bc0de]/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-trophy mr-2 text-[#5bc0de]"></i>
              Palmarès
            </h2>
            <ul className="space-y-4">
              {club.palmares?.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <i className={`fas fa-${item.icon} text-${item.color === 'yellow' ? 'yellow-400' : item.color === 'gray' ? 'gray-300' : '[#5bc0de]'} text-2xl mt-1`}></i>
                  <div>
                    <h3 className="font-bold text-white text-lg">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Valeurs */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            <i className="fas fa-heart mr-2 text-[#5bc0de]"></i>
            Nos Valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {club.values?.map((value, i) => (
              <div key={i} className="text-center p-6 bg-white/5 rounded-xl">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: value.color }}>
                  <i className={`fas fa-${value.icon} text-3xl text-white`}></i>
                </div>
                <h3 className="font-bold text-white text-xl mb-3">{value.title}</h3>
                <p className="text-white/60">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-dumbbell mr-2 text-[#5bc0de]"></i>
              Nos Équipements
            </h2>
            <ul className="space-y-3">
              {club.equipments?.map((eq, i) => (
                <li key={i} className="flex items-center gap-3">
                  <i className="fas fa-check-circle text-green-400 text-xl"></i>
                  <span className="text-white">{eq}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-map-marker-alt mr-2 text-[#5bc0de]"></i>
              Nous Trouver
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-building text-[#5bc0de] text-xl mt-1"></i>
                <div>
                  <h3 className="font-semibold text-white mb-1">Adresse</h3>
                  <p className="text-white/70">{global.address}</p>
                  <p className="text-white/70">{global.postal_code} {global.city}</p>
                </div>
              </div>
              {global.contact_email && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-envelope text-[#5bc0de] text-xl mt-1"></i>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <a href={`mailto:${global.contact_email}`} className="text-[#5bc0de] hover:underline">
                      {global.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {global.contact_phone && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-phone text-[#5bc0de] text-xl mt-1"></i>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Téléphone</h3>
                    <a href={`tel:${global.contact_phone}`} className="text-[#5bc0de] hover:underline">
                      {global.contact_phone}
                    </a>
                  </div>
                </div>
              )}
              {global.maps_url && (
                <a
                  href={global.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#5bc0de] text-white rounded-lg hover:bg-[#4ab0ce] transition-colors"
                >
                  <i className="fas fa-map-marker-alt"></i>
                  Voir sur Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="bg-[#5bc0de]/20 border border-[#5bc0de]/30 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Le {global.site_name} en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">{yearsExistence}+</div>
              <div className="text-white/70">Années d&apos;existence</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">{global.nb_licencies}+</div>
              <div className="text-white/70">Licenciés</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">{global.nb_equipes}</div>
              <div className="text-white/70">Équipes engagées</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">{global.nb_entraineurs}</div>
              <div className="text-white/70">Entraîneurs diplômés</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#5bc0de] text-white rounded-full font-bold text-lg hover:bg-[#4ab0ce] transition-colors">
            <i className="fas fa-envelope"></i>
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  )
}
