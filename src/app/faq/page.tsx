import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import FaqAccordion from '@/components/FaqAccordion'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { faqJsonLd, breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'FAQ - Questions Fréquentes | TLSTT Tennis de Table',
  description: 'Toutes les réponses à vos questions sur le club TLSTT : inscription, horaires, compétitions, tarifs, handisport...',
  keywords: ['FAQ', 'questions', 'inscription', 'horaires', 'tarifs', 'TLSTT', 'tennis de table', 'handisport', 'Toulon'],
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: 'FAQ - Questions Fréquentes TLSTT',
    description: 'Inscription, horaires, compétitions, tarifs, handisport — toutes vos questions sur le TLSTT.',
    url: `${SITE_URL}/faq`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default async function FaqPage() {
  const supabase = await createClient()

  const { data: faqItems } = await supabase
    .from('faq')
    .select('*, faq_categories(name, position)')
    .eq('is_active', true)
    .order('position')

  // Grouper par catégorie
  const grouped: Record<string, { category: string; position: number; items: any[] }> = {}
  if (faqItems) {
    for (const item of faqItems) {
      const catName = item.faq_categories?.name ?? 'Général'
      const catPos = item.faq_categories?.position ?? 99
      if (!grouped[catName]) grouped[catName] = { category: catName, position: catPos, items: [] }
      grouped[catName].items.push(item)
    }
  }

  const sortedGroups = Object.values(grouped).sort((a, b) => a.position - b.position)

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'FAQ', url: '/faq' },
      ])} />
      {faqItems && faqItems.length > 0 && (
        <JsonLd data={faqJsonLd(faqItems.map((item: any) => ({ question: item.question, answer: item.answer })))} />
      )}
      {/* Hero */}
      <section className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-question-circle text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Questions <span className="text-[#3b9fd8]">Fréquentes</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Vous avez une question ? Consultez notre FAQ ou contactez-nous directement.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          {sortedGroups.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <i className="fas fa-question-circle text-4xl mb-4 text-[#3b9fd8]"></i>
              <p>La FAQ sera disponible prochainement.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {sortedGroups.map(({ category, items }) => (
                <div key={category}>
                  <h2 className="text-xl font-bold text-[#3b9fd8] mb-6 flex items-center gap-3">
                    <i className="fas fa-folder-open text-lg"></i>
                    {category}
                  </h2>
                  <FaqAccordion items={items} />
                </div>
              ))}
            </div>
          )}

          {/* Still have questions */}
          <div className="mt-16 bg-[#1a1a1a] border border-[#3b9fd8]/30 rounded-2xl p-8 text-center">
            <i className="fas fa-comments text-4xl text-[#3b9fd8] mb-4"></i>
            <h3 className="text-2xl font-bold text-white mb-3">Vous n&apos;avez pas trouvé la réponse ?</h3>
            <p className="text-gray-400 mb-6">Notre équipe est disponible pour répondre à toutes vos questions.</p>
            <Link
              href="/contact"
              className="bg-[#3b9fd8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
            >
              <i className="fas fa-envelope mr-2"></i>
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
