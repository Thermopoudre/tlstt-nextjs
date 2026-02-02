import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

export default async function PartenairesPage() {
  const supabase = await createClient()

  // Récupérer tous les partenaires actifs
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('position')

  // Grouper par catégorie
  const partnersByCategory = {
    principal: partners?.filter(p => p.category === 'principal') || [],
    premium: partners?.filter(p => p.category === 'premium') || [],
    standard: partners?.filter(p => p.category === 'standard') || [],
    institutionnel: partners?.filter(p => p.category === 'institutionnel') || [],
  }

  const categories = {
    principal: { label: 'Partenaires Principaux', icon: 'fa-star', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-500' },
    premium: { label: 'Partenaires Premium', icon: 'fa-gem', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', textColor: 'text-purple-500' },
    standard: { label: 'Partenaires', icon: 'fa-handshake', bgColor: 'bg-[#3b9fd8]/10', borderColor: 'border-[#3b9fd8]/30', textColor: 'text-[#3b9fd8]' },
    institutionnel: { label: 'Partenaires Institutionnels', icon: 'fa-building', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30', textColor: 'text-gray-400' },
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] py-16 border-b border-[#222]">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-handshake mr-3 text-[#3b9fd8]"></i>
            Nos Partenaires
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Le club TLSTT remercie chaleureusement ses partenaires qui contribuent à son développement
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">Principaux</p>
                <p className="text-3xl font-bold text-yellow-500">{partnersByCategory.principal.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-star text-2xl text-yellow-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">Premium</p>
                <p className="text-3xl font-bold text-purple-500">{partnersByCategory.premium.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-gem text-2xl text-purple-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center border-l-4 border-l-[#3b9fd8]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">Standard</p>
                <p className="text-3xl font-bold text-[#3b9fd8]">{partnersByCategory.standard.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#3b9fd8]/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-handshake text-2xl text-[#3b9fd8]"></i>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center border-l-4 border-l-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">Institutionnels</p>
                <p className="text-3xl font-bold text-gray-400">{partnersByCategory.institutionnel.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-2xl text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Partenaires par catégorie */}
        {Object.entries(partnersByCategory).map(([key, partners]) => {
          if (partners.length === 0) return null
          const category = categories[key as keyof typeof categories]

          return (
            <div key={key} className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-8 pb-4 border-b-2 border-[#3b9fd8] flex items-center gap-3">
                <i className={`fas ${category.icon} ${category.textColor}`}></i>
                {category.label}
              </h2>

              <div className={`grid grid-cols-1 ${key === 'principal' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                {partners.map((partner: any) => (
                  <div
                    key={partner.id}
                    className={`bg-[#1a1a1a] border border-[#333] rounded-xl p-6 group hover:border-[#3b9fd8]/50 transition-all duration-300 hover:scale-[1.02]`}
                  >
                    {/* Logo */}
                    <div className={`relative ${key === 'principal' ? 'h-48' : 'h-32'} bg-[#111] rounded-lg overflow-hidden mb-4`}>
                      {partner.logo_url ? (
                        <Image
                          src={partner.logo_url}
                          alt={partner.name}
                          fill
                          className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-building text-4xl text-gray-600"></i>
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#3b9fd8] transition-colors">
                        {partner.name}
                      </h3>
                      
                      {partner.description && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                          {partner.description}
                        </p>
                      )}

                      {/* Infos supplémentaires */}
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-[#3b9fd8] transition-colors"
                          >
                            <i className="fas fa-globe text-[#3b9fd8]"></i>
                            <span className="underline">Visiter le site</span>
                          </a>
                        )}
                        {partner.email && (
                          <a
                            href={`mailto:${partner.email}`}
                            className="flex items-center gap-2 hover:text-[#3b9fd8] transition-colors"
                          >
                            <i className="fas fa-envelope text-[#3b9fd8]"></i>
                            <span>{partner.email}</span>
                          </a>
                        )}
                        {partner.phone && (
                          <a
                            href={`tel:${partner.phone}`}
                            className="flex items-center gap-2 hover:text-[#3b9fd8] transition-colors"
                          >
                            <i className="fas fa-phone text-[#3b9fd8]"></i>
                            <span>{partner.phone}</span>
                          </a>
                        )}
                      </div>

                      {/* Badge partenaire depuis */}
                      {partner.since_year && (
                        <div className="inline-flex items-center gap-2 bg-[#3b9fd8]/10 text-[#3b9fd8] px-3 py-1 rounded-full text-xs font-semibold border border-[#3b9fd8]/30">
                          <i className="fas fa-calendar-check"></i>
                          Partenaire depuis {partner.since_year}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Devenir partenaire */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 mt-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-[#3b9fd8]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-trophy text-5xl text-[#3b9fd8]"></i>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-3">Devenez Partenaire</h2>
              <p className="text-gray-400 mb-6 text-lg">
                Rejoignez nos partenaires et soutenez le développement du tennis de table à Toulon La Seyne
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link href="/contact" className="bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
                  <i className="fas fa-envelope mr-2"></i>
                  Nous contacter
                </Link>
                <a
                  href="mailto:contact@tlstt.fr"
                  className="bg-[#1a1a1a] border border-[#333] text-white hover:bg-[#222] px-6 py-3 rounded-full font-semibold transition-all"
                >
                  <i className="fas fa-phone mr-2"></i>
                  06 12 34 56 78
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Avantages partenariat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 border-l-4 border-l-[#3b9fd8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#3b9fd8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-eye text-2xl text-[#3b9fd8]"></i>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Visibilité</h3>
                <p className="text-sm text-gray-500">
                  Votre logo sur notre site, nos réseaux sociaux et lors de nos événements
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 border-l-4 border-l-[#3b9fd8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#3b9fd8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-users text-2xl text-[#3b9fd8]"></i>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Communauté</h3>
                <p className="text-sm text-gray-500">
                  Accès privilégié à une communauté sportive active et dynamique
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 border-l-4 border-l-[#3b9fd8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#3b9fd8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-heart text-2xl text-[#3b9fd8]"></i>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Valeurs</h3>
                <p className="text-sm text-gray-500">
                  Soutenez les valeurs du sport et l'inclusion sociale
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
