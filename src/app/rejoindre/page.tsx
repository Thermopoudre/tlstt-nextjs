import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Rejoindre le TLSTT | Tennis de Table Toulon La Seyne',
  description: 'Rejoignez le TLSTT, club de tennis de table à Toulon et La Seyne-sur-Mer. 1ère séance gratuite, tous niveaux bienvenus, handisport. Découvrez nos tarifs et le processus d\'inscription.',
  alternates: { canonical: '/rejoindre' },
  openGraph: {
    title: 'Rejoindre le TLSTT – Tennis de Table Toulon La Seyne',
    description: '1ère séance gratuite. Tous niveaux et âges bienvenus. Section handisport.',
  },
}

export default async function RejoindreePage() {
  const supabase = await createClient()

  const { data: tarifs } = await supabase
    .from('tarifs')
    .select('*, tarif_categories(name, position)')
    .eq('is_active', true)
    .order('position')

  // Grouper par catégorie, triés par position
  const grouped: { category: string; position: number; items: any[] }[] = []
  if (tarifs) {
    const map: Record<string, { category: string; position: number; items: any[] }> = {}
    for (const t of tarifs) {
      const catName = t.tarif_categories?.name ?? 'Autres'
      const catPos = t.tarif_categories?.position ?? 99
      if (!map[catName]) map[catName] = { category: catName, position: catPos, items: [] }
      map[catName].items.push(t)
    }
    grouped.push(...Object.values(map).sort((a, b) => a.position - b.position))
  }

  const avantages = [
    {
      icon: 'fa-users',
      color: '#3b9fd8',
      title: 'Tous niveaux bienvenus',
      description: 'Débutant ou compétiteur confirmé, nous avons un entraînement adapté à votre niveau.',
    },
    {
      icon: 'fa-medal',
      color: '#f59e0b',
      title: 'Club compétitif',
      description: 'Engagé en championnat par équipes, avec des joueurs classés et une tradition palmarès.',
    },
    {
      icon: 'fa-wheelchair',
      color: '#10b981',
      title: 'Section Handisport',
      description: 'Nous accueillons chaleureusement les joueurs en situation de handicap dans une section dédiée.',
    },
    {
      icon: 'fa-gift',
      color: '#8b5cf6',
      title: '1ère séance gratuite',
      description: 'Venez tester sans engagement. La première séance est offerte pour tout nouveau venu.',
    },
    {
      icon: 'fa-id-card',
      color: '#ef4444',
      title: 'Licence FFTT incluse',
      description: 'Votre licence fédérale (FFTT) est incluse dans le tarif d\'adhésion. Pas de surprise.',
    },
    {
      icon: 'fa-map-marker-alt',
      color: '#06b6d4',
      title: 'Deux sites',
      description: 'Entraînements sur Toulon et La Seyne-sur-Mer, pour s\'adapter à votre lieu de résidence.',
    },
  ]

  const etapes = [
    {
      num: '1',
      icon: 'fa-eye',
      title: 'Venez essayer',
      description: 'Participez à une séance d\'entraînement gratuitement, sans inscription préalable. Présentez-vous simplement à la salle.',
    },
    {
      num: '2',
      icon: 'fa-comments',
      title: 'Rencontrez l\'équipe',
      description: 'Échangez avec nos entraîneurs et adhérents. Posez toutes vos questions sur le club et les créneaux.',
    },
    {
      num: '3',
      icon: 'fa-file-alt',
      title: 'Inscrivez-vous',
      description: 'Remplissez le dossier d\'adhésion (fiche, certificat médical, photo) et choisissez votre formule.',
    },
    {
      num: '4',
      icon: 'fa-check-circle',
      title: 'Bienvenue au club !',
      description: 'Votre licence FFTT est enregistrée, vous pouvez participer aux entraînements et compétitions.',
    },
  ]

  return (
    <div className="bg-[#0a0a0a] min-h-screen">

      {/* ── Hero ── */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-[#0a0a0a] border-b border-[#222]">
        {/* Decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3b9fd8]/5 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#3b9fd8]/5 rounded-full blur-3xl translate-y-1/2"></div>
        </div>

        <div className="container-custom relative text-center">
          <span className="inline-flex items-center gap-2 bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 text-[#3b9fd8] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <i className="fas fa-table-tennis-paddle-ball"></i>
            Saison 2024-2025 ouverte
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Rejoignez le{' '}
            <span className="text-[#3b9fd8]">TLSTT</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Toulon La Seyne Tennis de Table — club convivial, compétitif et inclusif.
            Tous niveaux, tous âges. La 1ère séance est <strong className="text-white">gratuite</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-[#3b9fd8] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors text-base"
            >
              <i className="fas fa-envelope mr-2"></i>
              Nous contacter
            </Link>
            <Link
              href="/planning"
              className="border border-[#3b9fd8]/50 text-[#3b9fd8] px-8 py-3.5 rounded-full font-bold hover:bg-[#3b9fd8]/10 transition-colors text-base"
            >
              <i className="fas fa-calendar mr-2"></i>
              Voir les horaires
            </Link>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <i className="fas fa-check-circle text-[#10b981]"></i>
              1ère séance gratuite
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-check-circle text-[#10b981]"></i>
              Licence FFTT incluse
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-check-circle text-[#10b981]"></i>
              Tous niveaux
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-check-circle text-[#10b981]"></i>
              Handisport
            </span>
          </div>
        </div>
      </section>

      {/* ── Pourquoi nous rejoindre ── */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pourquoi choisir le <span className="text-[#3b9fd8]">TLSTT</span> ?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Un club qui allie ambition sportive et bonne humeur depuis des années.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avantages.map((av, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-[#333] hover:border-[#3b9fd8]/40 rounded-2xl p-6 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: av.color + '20' }}
                >
                  <i className={`fas ${av.icon} text-xl`} style={{ color: av.color }}></i>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{av.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{av.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section className="py-20 bg-[#111] border-y border-[#3b9fd8]/10">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tarifs <span className="text-[#3b9fd8]">Saison 2024-2025</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Des formules adaptées à chaque profil. Tout est inclus — licence FFTT comprise.
            </p>
          </div>

          {grouped.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-tags text-4xl text-[#3b9fd8]/40 mb-4 block"></i>
              <p className="text-gray-500">Les tarifs seront affichés prochainement.</p>
              <Link href="/contact" className="mt-4 inline-block text-[#3b9fd8] hover:underline">
                Nous contacter pour plus d&apos;infos →
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map(({ category, items }) => (
                <div key={category}>
                  <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-[#3b9fd8] rounded-full"></span>
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((tarif: any) => (
                      <div
                        key={tarif.id}
                        className="bg-[#1a1a1a] border border-[#333] hover:border-[#3b9fd8]/50 rounded-xl p-5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold text-white leading-tight flex-1">{tarif.label}</h4>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-[#3b9fd8]">{tarif.price}€</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">/saison</div>
                          </div>
                        </div>
                        {tarif.description && (
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{tarif.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes tarifs */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: 'fa-gift', label: '1ère séance gratuite', desc: 'Essai sans engagement avant inscription' },
              { icon: 'fa-id-card', label: 'Licence FFTT incluse', desc: 'Fédération incluse dans la cotisation' },
              { icon: 'fa-credit-card', label: 'Paiement flexible', desc: 'Chèque, virement ou espèces acceptés' },
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#1a1a1a] border border-[#3b9fd8]/20 rounded-xl p-4">
                <i className={`fas ${note.icon} text-[#3b9fd8] text-lg mt-0.5`}></i>
                <div>
                  <p className="font-semibold text-white text-sm">{note.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{note.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Processus d'inscription ── */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comment <span className="text-[#3b9fd8]">s&apos;inscrire ?</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Un processus simple en 4 étapes. Vous pouvez aussi nous contacter et on s&apos;occupe de tout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Ligne connectrice desktop */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-[#3b9fd8]/30 to-transparent hidden lg:block" aria-hidden></div>

            {etapes.map((etape, i) => (
              <div key={i} className="relative text-center">
                <div className="relative w-20 h-20 bg-[#3b9fd8]/10 border-2 border-[#3b9fd8]/30 rounded-full flex flex-col items-center justify-center mx-auto mb-5 hover:border-[#3b9fd8] transition-colors">
                  <i className={`fas ${etape.icon} text-[#3b9fd8] text-2xl`}></i>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#3b9fd8] text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {etape.num}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">{etape.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-[220px] mx-auto">{etape.description}</p>
              </div>
            ))}
          </div>

          {/* Documents nécessaires */}
          <div className="mt-14 bg-[#1a1a1a] border border-[#3b9fd8]/20 rounded-2xl p-6 md:p-8">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <i className="fas fa-clipboard-list text-[#3b9fd8]"></i>
              Documents à prévoir pour l&apos;inscription
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: 'fa-file-medical', label: 'Certificat médical', desc: 'Aptitude à la pratique du tennis de table' },
                { icon: 'fa-portrait', label: 'Photo d\'identité', desc: 'Pour la licence FFTT' },
                { icon: 'fa-money-check', label: 'Règlement', desc: 'Chèque, virement ou espèces' },
                { icon: 'fa-file-signature', label: 'Fiche d\'adhésion', desc: 'Fournie par le club ou à télécharger' },
              ].map((doc, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#0a0a0a] rounded-xl">
                  <i className={`fas ${doc.icon} text-[#3b9fd8]/70 text-base mt-0.5`}></i>
                  <div>
                    <p className="text-sm font-semibold text-white">{doc.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ rapide ── */}
      <section className="py-20 bg-[#111] border-y border-[#3b9fd8]/10">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">
              Questions <span className="text-[#3b9fd8]">fréquentes</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Je suis grand débutant, puis-je quand même m\'inscrire ?',
                a: 'Absolument ! Le TLSTT accueille tous les niveaux, du débutant complet au joueur expérimenté. Des créneaux adaptés sont organisés en fonction de votre niveau.',
              },
              {
                q: 'Quel matériel dois-je apporter ?',
                a: 'Rien du tout pour la première séance ! Le club prête des raquettes aux débutants. Une tenue confortable et des chaussures de sport suffisent.',
              },
              {
                q: 'À partir de quel âge peut-on s\'inscrire ?',
                a: 'Il n\'y a pas d\'âge minimum. Nous accueillons les enfants (à partir de 6-7 ans), adultes et seniors. Des tarifs spécifiques existent pour chaque tranche d\'âge.',
              },
              {
                q: 'Peut-on s\'inscrire en cours de saison ?',
                a: 'Oui, les inscriptions sont ouvertes tout au long de la saison (septembre à juin). Un tarif proratisé peut être appliqué selon la période.',
              },
            ].map((faq, i) => (
              <details key={i} className="group bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-semibold text-white text-sm hover:text-[#3b9fd8] transition-colors list-none">
                  <span>{faq.q}</span>
                  <i className="fas fa-chevron-down text-[#3b9fd8] text-xs transition-transform duration-300 group-open:rotate-180 flex-shrink-0"></i>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-[#333] pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/faq" className="text-[#3b9fd8] text-sm hover:underline">
              Voir toutes les questions fréquentes →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20">
        <div className="container-custom text-center max-w-2xl">
          <div className="bg-gradient-to-r from-[#3b9fd8]/20 to-[#3b9fd8]/5 border border-[#3b9fd8]/30 rounded-3xl p-10 md:p-14">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-table-tennis-paddle-ball text-3xl text-white"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à nous rejoindre ?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              La première séance est gratuite. Pas d&apos;engagement. Venez comme vous êtes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#3b9fd8] text-white rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
              >
                <i className="fas fa-envelope"></i>
                Nous écrire
              </Link>
              <Link
                href="/planning"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors"
              >
                <i className="fas fa-calendar"></i>
                Voir les horaires
              </Link>
            </div>
            <p className="mt-8 text-xs text-gray-600">
              Ou retrouvez-nous directement lors d&apos;un entraînement — voir{' '}
              <Link href="/club/a-propos" className="text-[#3b9fd8]/70 hover:text-[#3b9fd8]">
                nos salles et adresses
              </Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
