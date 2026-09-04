import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicClient as createClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'
import { saisonActuelle } from '@/lib/saison'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'
import { ADRESSE_CLUB } from '@/lib/villes'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'

export const metadata: Metadata = {
  title: 'Cotisation et adhésion en ligne',
  description:
    "Adhérez au TLSTT en quelques minutes : réglez votre cotisation en ligne par carte bancaire via HelloAsso. Licence FFTT incluse, 1re séance d'essai gratuite.",
  keywords: ['cotisation', 'adhésion', 'inscription', 'licence FFTT', 'HelloAsso', 'TLSTT', 'tennis de table', 'La Seyne', 'Toulon'],
  alternates: { canonical: `${SITE_URL}/cotisation` },
  openGraph: {
    title: 'Adhérer au TLSTT — cotisation en ligne',
    description: 'Réglez votre cotisation en ligne, en toute sécurité. Licence FFTT incluse.',
    url: `${SITE_URL}/cotisation`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

/** Adresse du formulaire HelloAsso, réglée dans Admin → HelloAsso. */
async function lienHelloAsso(): Promise<string> {
  try {
    const { data } = await createAdminClient()
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'helloasso_cotisation_url')
      .single()
    const url = (data?.setting_value || '').trim()
    return /^https:\/\/(www\.)?helloasso\.com\//.test(url) ? url : ''
  } catch {
    return ''
  }
}

const ETAPES = [
  {
    icon: 'fa-table-tennis-paddle-ball',
    titre: 'Venez essayer',
    texte: "La première séance est gratuite, sans engagement. Raquettes prêtées sur place, à tout âge et à tout niveau.",
  },
  {
    icon: 'fa-credit-card',
    titre: 'Réglez votre cotisation',
    texte: "Directement en ligne ci-dessous par carte bancaire, ou sur place par chèque ou espèces auprès d'un membre du bureau.",
  },
  {
    icon: 'fa-id-card',
    titre: 'Recevez votre licence',
    texte: 'Le club transmet votre inscription à la fédération. Votre licence FFTT vous permet de jouer en compétition et d’être assuré.',
  },
]

export default async function CotisationPage() {
  const supabase = createClient()
  const [{ data: tarifs }, urlHelloAsso] = await Promise.all([
    // Seules les licences (la cotisation à proprement parler) : les frais de
    // compétition sont détaillés sur la page Tarifs.
    supabase
      .from('tarifs')
      .select('id, label, price, description, position, tarif_categories(name)')
      .eq('is_active', true)
      .order('position')
      .limit(12),
    lienHelloAsso(),
  ])

  const urlWidget = urlHelloAsso ? `${urlHelloAsso.replace(/\/$/, '')}/widget` : ''

  type LigneTarif = { id: number; label: string; price: string | number; description: string | null; tarif_categories?: { name?: string } | null }
  const licences = ((tarifs || []) as LigneTarif[]).filter(t => /licence|cotisation|adh/i.test(t.tarif_categories?.name || 'Licences')).slice(0, 4)
  const formaterPrix = (p: string | number) => {
    const n = Number(p)
    return Number.isFinite(n) ? `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)} €` : String(p)
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Cotisation', url: '/cotisation' },
      ])} />

      {/* Hero */}
      <section className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-id-card text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Adhésion <span className="text-[#3b9fd8]">{saisonActuelle()}</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Réglez votre cotisation en ligne en quelques minutes, en toute sécurité. Licence FFTT incluse.
            </p>
          </div>
        </div>
      </section>

      {/* Comment ça se passe */}
      <section className="py-14">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-6">
            {ETAPES.map((e, i) => (
              <div key={e.titre} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-[#3b9fd8] text-white font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <h2 className="text-lg font-bold text-white">
                    <i className={`fas ${e.icon} text-[#3b9fd8] mr-2`}></i>
                    {e.titre}
                  </h2>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rappel des tarifs */}
      {licences.length > 0 && (
        <section className="pb-14">
          <div className="container-custom">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">
                  <i className="fas fa-tags text-[#3b9fd8] mr-2"></i>
                  Montant des cotisations
                </h2>
                <Link href="/tarifs" className="text-[#3b9fd8] text-sm hover:underline">
                  Voir le détail des tarifs <i className="fas fa-arrow-right ml-1 text-xs"></i>
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {licences.map((t) => (
                  <div key={t.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#3b9fd8]">{formaterPrix(t.price)}</div>
                    <div className="text-white text-sm font-semibold mt-1">{t.label}</div>
                    {t.description && <div className="text-gray-500 text-xs mt-1">{t.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Formulaire HelloAsso */}
      <section className="pb-16">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            <i className="fas fa-lock text-[#3b9fd8] mr-2"></i>
            Payer ma cotisation en ligne
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Paiement sécurisé par HelloAsso, la plateforme gratuite des associations. Reçu envoyé automatiquement par email.
          </p>

          {urlWidget ? (
            <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl overflow-hidden border border-[#333] bg-white">
                <iframe
                  id="haWidget"
                  src={urlWidget}
                  title="Formulaire d'adhésion HelloAsso — TLSTT"
                  className="w-full"
                  style={{ height: '850px', border: 'none' }}
                  allow="payment"
                  loading="lazy"
                />
              </div>
              <p className="text-center text-gray-500 text-xs mt-4">
                Le formulaire ne s&apos;affiche pas ?{' '}
                <a href={urlHelloAsso} target="_blank" rel="noopener noreferrer" className="text-[#3b9fd8] hover:underline">
                  Ouvrir la page d&apos;adhésion HelloAsso
                </a>
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
              <i className="fas fa-hourglass-half text-3xl text-[#3b9fd8] mb-3"></i>
              <p className="text-gray-300 font-semibold mb-2">L&apos;adhésion en ligne arrive très bientôt.</p>
              <p className="text-gray-500 text-sm">
                En attendant, contactez-nous : nous vous inscrivons directement au club.
              </p>
              <Link href="/contact" className="inline-block mt-5 bg-[#3b9fd8] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2d8bc9] transition-colors">
                Nous contacter
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Aide */}
      <section className="pb-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-circle-question text-[#3b9fd8] mr-2"></i>
              Besoin d&apos;aide pour adhérer ?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="text-gray-400">
                <p className="text-white font-semibold mb-1">Sur place</p>
                <p>{ADRESSE_CLUB.complete}</p>
                <p className="mt-1">Aux horaires d&apos;entraînement — <Link href="/planning" className="text-[#3b9fd8] hover:underline">voir le planning</Link></p>
              </div>
              <div className="text-gray-400">
                <p className="text-white font-semibold mb-1">À distance</p>
                <p><Link href="/contact" className="text-[#3b9fd8] hover:underline">Formulaire de contact</Link></p>
                <p className="mt-1"><Link href="/faq" className="text-[#3b9fd8] hover:underline">Questions fréquentes</Link></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
