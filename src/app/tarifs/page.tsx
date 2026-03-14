import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Tarifs - TLSTT | Tennis de Table Toulon La Seyne',
  description: 'Découvrez les tarifs d\'adhésion au TLSTT pour la saison. Cotisations adultes, jeunes et formules loisir. 1ère séance d\'essai gratuite.',
  keywords: ['tarifs', 'adhésion', 'cotisation', 'TLSTT', 'tennis de table', 'Toulon', 'La Seyne', 'licence FFTT', 'inscription'],
  alternates: { canonical: `${SITE_URL}/tarifs` },
  openGraph: {
    title: 'Tarifs d\'adhésion - TLSTT Tennis de Table',
    description: 'Cotisations adultes, jeunes et formules loisir. Licence FFTT incluse. 1ère séance gratuite.',
    url: `${SITE_URL}/tarifs`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default async function TarifsPage() {
  const supabase = await createClient()

  const [{ data: tarifs }, { data: globalSettings }] = await Promise.all([
    supabase
      .from('tarifs')
      .select('*, tarif_categories(name, position)')
      .eq('is_active', true)
      .order('position'),
    supabase
      .from('site_settings')
      .select('settings')
      .eq('page', 'global')
      .single(),
  ])

  const saisonLabel: string = (globalSettings as any)?.settings?.tarifs_saison_label || 'Saison 2024-2025'

  // Grouper par catégorie, triées par position de catégorie
  const groupedMap: Record<string, { category: string; position: number; items: any[] }> = {}
  if (tarifs) {
    for (const t of tarifs) {
      const catName = t.tarif_categories?.name ?? 'Autres'
      const catPos = t.tarif_categories?.position ?? 99
      if (!groupedMap[catName]) groupedMap[catName] = { category: catName, position: catPos, items: [] }
      groupedMap[catName].items.push(t)
    }
  }
  const grouped = Object.values(groupedMap).sort((a, b) => a.position - b.position)

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Tarifs', url: '/tarifs' },
      ])} />
      {/* Hero */}
      <section className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-tags text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tarifs <span className="text-[#3b9fd8]">{saisonLabel}</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Rejoignez le TLSTT ! La première séance d&apos;essai est gratuite pour tous.
            </p>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-16">
        <div className="container-custom">
          {grouped.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <i className="fas fa-tags text-4xl mb-4 text-[#3b9fd8]"></i>
              <p>Les tarifs seront affichés prochainement.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.values(grouped).map(({ category, items }) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-[#3b9fd8] rounded-full inline-block"></span>
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((tarif) => (
                      <div
                        key={tarif.id}
                        className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 hover:border-[#3b9fd8]/60 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-white text-lg leading-tight flex-1 pr-4">{tarif.label}</h3>
                          <div className="text-right flex-shrink-0">
                            <span className="text-3xl font-bold text-[#3b9fd8]">{tarif.price}€</span>
                            <div className="text-xs text-gray-500">/saison</div>
                          </div>
                        </div>
                        {tarif.description && (
                          <p className="text-sm text-gray-400">{tarif.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info complémentaire */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1a1a1a] border border-[#3b9fd8]/20 rounded-xl p-6 text-center">
              <i className="fas fa-gift text-3xl text-[#3b9fd8] mb-3"></i>
              <h3 className="font-bold text-white mb-2">1ère séance gratuite</h3>
              <p className="text-sm text-gray-400">Venez essayer sans engagement avant de vous inscrire</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#3b9fd8]/20 rounded-xl p-6 text-center">
              <i className="fas fa-id-card text-3xl text-[#3b9fd8] mb-3"></i>
              <h3 className="font-bold text-white mb-2">Licence FFTT incluse</h3>
              <p className="text-sm text-gray-400">La licence fédérale est incluse dans la cotisation</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#3b9fd8]/20 rounded-xl p-6 text-center">
              <i className="fas fa-wheelchair text-3xl text-[#3b9fd8] mb-3"></i>
              <h3 className="font-bold text-white mb-2">Handisport</h3>
              <p className="text-sm text-gray-400">Nous accueillons également les joueurs handisport</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-[#3b9fd8]/20 to-[#3b9fd8]/5 border border-[#3b9fd8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Prêt à rejoindre l&apos;aventure TLSTT ?</h2>
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
                href="/faq"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors"
              >
                <i className="fas fa-question-circle"></i>
                Voir la FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
