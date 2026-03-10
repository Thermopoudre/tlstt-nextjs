import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Palmarès - TLSTT | Tennis de Table Toulon La Seyne',
  description: 'Le palmarès du TLSTT : titres, championnats et distinctions obtenues par le club de tennis de table de Toulon La Seyne depuis 1950.',
  keywords: ['palmarès', 'titres', 'championnats', 'TLSTT', 'tennis de table', 'Toulon', 'La Seyne', 'distinctions'],
  alternates: { canonical: `${SITE_URL}/palmares` },
  openGraph: {
    title: 'Palmarès du TLSTT',
    description: 'Tous les titres et distinctions du club de tennis de table TLSTT à Toulon La Seyne.',
    url: `${SITE_URL}/palmares`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

const medalConfig = {
  or: { icon: 'fa-trophy', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', label: 'Or' },
  argent: { icon: 'fa-medal', color: 'text-gray-300', bg: 'bg-gray-400/10 border-gray-400/30', label: 'Argent' },
  bronze: { icon: 'fa-medal', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', label: 'Bronze' },
  participation: { icon: 'fa-star', color: 'text-[#3b9fd8]', bg: 'bg-[#3b9fd8]/10 border-[#3b9fd8]/30', label: 'Participation' },
}

export default async function PalmaresPage() {
  const supabase = await createClient()

  const { data: palmares } = await supabase
    .from('palmares')
    .select('*')
    .eq('is_active', true)
    .order('year', { ascending: false })
    .order('medal_type')

  // Grouper par année
  const byYear: Record<number, any[]> = {}
  if (palmares) {
    for (const p of palmares) {
      if (!byYear[p.year]) byYear[p.year] = []
      byYear[p.year].push(p)
    }
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  const totalGold = palmares?.filter(p => p.medal_type === 'or').length ?? 0
  const totalSilver = palmares?.filter(p => p.medal_type === 'argent').length ?? 0
  const totalBronze = palmares?.filter(p => p.medal_type === 'bronze').length ?? 0

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Palmarès', url: '/palmares' },
      ])} />
      {/* Hero */}
      <section className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-trophy text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Palmarès <span className="text-[#3b9fd8]">du Club</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              L&apos;histoire sportive du TLSTT à travers ses titres et distinctions.
            </p>

            {/* Stats médailles */}
            {(totalGold + totalSilver + totalBronze) > 0 && (
              <div className="flex justify-center gap-8 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{totalGold}</div>
                  <div className="text-sm text-gray-400">Or</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-300">{totalSilver}</div>
                  <div className="text-sm text-gray-400">Argent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{totalBronze}</div>
                  <div className="text-sm text-gray-400">Bronze</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Palmares */}
      <section className="py-16">
        <div className="container-custom max-w-5xl">
          {years.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <i className="fas fa-trophy text-4xl mb-4 text-[#3b9fd8]"></i>
              <p>Le palmarès sera disponible prochainement.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {years.map((year) => (
                <div key={year}>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-[#3b9fd8]">{year}</span>
                    <span className="flex-1 h-px bg-[#333]"></span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {byYear[year].map((item) => {
                      const medal = medalConfig[item.medal_type as keyof typeof medalConfig] ?? medalConfig.participation
                      return (
                        <div
                          key={item.id}
                          className={`bg-[#1a1a1a] border rounded-xl p-5 flex items-start gap-4 ${medal.bg}`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${medal.bg}`}>
                            <i className={`fas ${medal.icon} text-xl ${medal.color}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${medal.color}`}>
                              {medal.label}
                            </div>
                            <h3 className="font-bold text-white">{item.competition}</h3>
                            <p className="text-sm text-gray-300 mt-1">{item.result}</p>
                            {item.category && (
                              <p className="text-xs text-gray-500 mt-1">
                                <i className="fas fa-tag mr-1"></i>{item.category}
                              </p>
                            )}
                            {item.players && (
                              <p className="text-xs text-gray-500 mt-1">
                                <i className="fas fa-users mr-1"></i>{item.players}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 bg-gradient-to-r from-[#3b9fd8]/20 to-[#3b9fd8]/5 border border-[#3b9fd8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Envie d&apos;écrire votre palmarès ?</h2>
            <p className="text-gray-400 mb-6">Rejoignez le TLSTT et participez à nos compétitions, tous niveaux acceptés !</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/rejoindre"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3b9fd8] text-white rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
              >
                <i className="fas fa-table-tennis-paddle-ball"></i>
                Rejoindre le club
              </Link>
              <Link
                href="/equipes"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors"
              >
                <i className="fas fa-users"></i>
                Voir les équipes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
