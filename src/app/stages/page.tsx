import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Stages Tennis de Table - TLSTT | Toulon La Seyne',
  description: 'Stages de tennis de table au TLSTT : stages vacances, stages de perfectionnement, stages jeunes. Encadrement par des entraîneurs diplômés d\'État.',
  keywords: ['stages', 'tennis de table', 'TLSTT', 'Toulon', 'La Seyne', 'vacances', 'perfectionnement', 'jeunes', 'handisport'],
  alternates: { canonical: `${SITE_URL}/stages` },
  openGraph: {
    title: 'Stages Tennis de Table - TLSTT',
    description: 'Stages vacances, perfectionnement, jeunes — encadrement par des entraîneurs diplômés. Tous niveaux acceptés.',
    url: `${SITE_URL}/stages`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

const STAGE_TYPES = [
  {
    icon: 'fa-sun',
    title: 'Stages Vacances',
    description: 'Durant les vacances scolaires, nous proposons des stages intensifs de plusieurs jours pour progresser rapidement dans une ambiance conviviale.',
    details: ['Petits groupes (6 à 8 joueurs max)', 'Tous niveaux débutants à confirmés', 'Sessions de 3h par jour', 'Matériel fourni'],
    color: 'from-[#3b9fd8]/20 to-[#3b9fd8]/5',
    border: 'border-[#3b9fd8]/30',
  },
  {
    icon: 'fa-chart-line',
    title: 'Stages Perfectionnement',
    description: 'Pour les joueurs licenciés souhaitant travailler des aspects techniques précis : coup droit, revers, service, jeu en déplacement.',
    details: ['Niveau intermédiaire à avancé', 'Analyse vidéo possible', 'Travail technique individualisé', 'Matchs commentés'],
    color: 'from-[#f59e0b]/20 to-[#f59e0b]/5',
    border: 'border-[#f59e0b]/30',
  },
  {
    icon: 'fa-child',
    title: 'Stages Jeunes',
    description: 'Des stages spécialement conçus pour les enfants et adolescents (6 à 17 ans) pour découvrir le tennis de table dans un cadre ludique et éducatif.',
    details: ['Dès 6 ans', 'Pédagogie adaptée', 'Jeux et tournois internes', 'Surveillance permanente'],
    color: 'from-[#10b981]/20 to-[#10b981]/5',
    border: 'border-[#10b981]/30',
  },
  {
    icon: 'fa-wheelchair',
    title: 'Stages Handisport',
    description: 'Nos entraîneurs sont formés pour accueillir les joueurs en situation de handicap. Stages adaptés avec matériel spécifique disponible.',
    details: ['Salle accessible PMR', 'Entraîneurs formés handisport', 'Matériel adapté', 'Tous handicaps acceptés'],
    color: 'from-[#8b5cf6]/20 to-[#8b5cf6]/5',
    border: 'border-[#8b5cf6]/30',
  },
]

const INFOS_PRATIQUES = [
  { icon: 'fa-map-marker-alt', label: 'Lieu', value: 'Gymnase municipal de La Seyne-sur-Mer et Toulon' },
  { icon: 'fa-clock', label: 'Durée', value: '1 à 5 jours selon le stage' },
  { icon: 'fa-users', label: 'Groupes', value: 'Maximum 8 joueurs par groupe pour un suivi personnalisé' },
  { icon: 'fa-graduation-cap', label: 'Encadrement', value: 'Entraîneurs diplômés d\'État BEES/DE Tennis de Table' },
  { icon: 'fa-id-card', label: 'Assurance', value: 'Licence FFTT recommandée ou assurance RC personnelle' },
  { icon: 'fa-utensils', label: 'Repas', value: 'Repas non inclus (sauf stages résidentiels spécifiques)' },
]

export default async function StagesPage() {
  const supabase = await createClient()

  // Charger les prochains stages depuis la table stages
  let stageActus: any[] | null = null
  try {
    const { data } = await supabase
      .from('stages')
      .select('id, title, type, date_debut, date_fin, lieu, capacite, inscrits, prix')
      .eq('is_published', true)
      .eq('is_active', true)
      .gte('date_fin', new Date().toISOString().split('T')[0])
      .order('date_debut', { ascending: true })
      .limit(3)
    stageActus = data
  } catch {
    // Table absente ou erreur — on ignore
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Club', url: '/club/a-propos' },
        { name: 'Stages', url: '/stages' },
      ])} />

      {/* Hero */}
      <section className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-graduation-cap text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Stages <span className="text-[#3b9fd8]">TLSTT</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Progressez rapidement grâce à nos stages encadrés par des entraîneurs diplômés.
              Stages vacances, perfectionnement, jeunes et handisport.
            </p>
          </div>
        </div>
      </section>

      {/* Types de stages */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">
            Nos <span className="text-[#3b9fd8]">formules de stages</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STAGE_TYPES.map((stage) => (
              <div
                key={stage.title}
                className={`bg-gradient-to-br ${stage.color} border ${stage.border} rounded-2xl p-6 hover:scale-[1.01] transition-transform`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${stage.icon} text-xl text-[#3b9fd8]`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{stage.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{stage.description}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {stage.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-gray-300">
                      <i className="fas fa-check text-[#3b9fd8] text-xs flex-shrink-0"></i>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prochains stages — depuis actualites ou message vide */}
      <section className="py-12 bg-[#0f0f0f] border-y border-[#222]">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Prochains <span className="text-[#3b9fd8]">stages</span>
          </h2>
          {stageActus && stageActus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stageActus.map((stage: any) => {
                const typeColors: Record<string, string> = {
                  vacances: 'text-[#3b9fd8] bg-[#3b9fd8]/10',
                  perfectionnement: 'text-yellow-400 bg-yellow-400/10',
                  jeunes: 'text-green-400 bg-green-400/10',
                  handisport: 'text-purple-400 bg-purple-400/10',
                }
                const typeLabels: Record<string, string> = {
                  vacances: 'Vacances',
                  perfectionnement: 'Perfectionnement',
                  jeunes: 'Jeunes',
                  handisport: 'Handisport',
                }
                const colorClass = typeColors[stage.type] || 'text-[#3b9fd8] bg-[#3b9fd8]/10'
                return (
                  <div
                    key={stage.id}
                    className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 hover:border-[#3b9fd8]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>
                        {typeLabels[stage.type] || stage.type}
                      </span>
                      {stage.prix && (
                        <span className="text-sm font-bold text-white">{stage.prix} €</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm mb-3 line-clamp-2">{stage.title}</h3>
                    <div className="space-y-1.5 text-xs text-gray-400">
                      <p>
                        <i className="fas fa-calendar mr-1.5 text-[#3b9fd8]"></i>
                        {new Date(stage.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        {' → '}
                        {new Date(stage.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {stage.lieu && (
                        <p><i className="fas fa-map-marker-alt mr-1.5 text-[#3b9fd8]"></i>{stage.lieu}</p>
                      )}
                      {stage.capacite && (
                        <p>
                          <i className="fas fa-users mr-1.5 text-[#3b9fd8]"></i>
                          {stage.inscrits ?? 0}/{stage.capacite} places
                        </p>
                      )}
                    </div>
                    <Link
                      href="/contact"
                      className="mt-4 block text-center text-xs font-semibold text-[#3b9fd8] border border-[#3b9fd8]/40 rounded-lg py-1.5 hover:bg-[#3b9fd8]/10 transition-colors"
                    >
                      S&apos;inscrire
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-2xl max-w-2xl mx-auto">
              <i className="fas fa-calendar-alt text-4xl text-[#3b9fd8] mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-3">Programme en cours de finalisation</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Les dates des prochains stages seront annoncées prochainement.
                Inscrivez-vous à notre newsletter pour être informé en priorité.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-colors text-sm"
                >
                  <i className="fas fa-envelope"></i>
                  Être informé
                </Link>
                <Link
                  href="/newsletter"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors text-sm"
                >
                  <i className="fas fa-bell"></i>
                  Newsletter
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Infos pratiques */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">
            Infos <span className="text-[#3b9fd8]">pratiques</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {INFOS_PRATIQUES.map((info) => (
              <div key={info.label} className="flex items-start gap-4 bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                <div className="w-10 h-10 bg-[#3b9fd8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${info.icon} text-[#3b9fd8]`}></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{info.label}</p>
                  <p className="text-sm text-gray-300">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Déroulement type */}
      <section className="py-12 bg-[#0f0f0f] border-y border-[#222]">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Déroulement type <span className="text-[#3b9fd8]">d&apos;un stage</span>
          </h2>
          <div className="relative">
            {/* Timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#3b9fd8]/20 hidden md:block"></div>
            <div className="space-y-6">
              {[
                { time: '09h00', title: 'Accueil & échauffement', desc: 'Présentation, mise en place, échauffement physique et technique de 30 minutes.' },
                { time: '09h30', title: 'Travail technique', desc: 'Exercices ciblés sur les fondamentaux ou éléments techniques spécifiques au programme du stage.' },
                { time: '11h00', title: 'Jeu semi-dirigé', desc: 'Mise en application des acquis dans des situations de jeu avec consignes tactiques.' },
                { time: '12h00', title: 'Pause déjeuner', desc: 'Pause de 1h à 1h30 (repas non fourni sauf mention contraire).' },
                { time: '13h30', title: 'Service & retour de service', desc: 'Travail spécifique sur les services et leur neutralisation, un aspect clé du tennis de table moderne.' },
                { time: '15h00', title: 'Tournoi interne & bilan', desc: 'Mini-tournoi pour mettre en pratique tout ce qui a été appris, suivi d\'un debriefing collectif.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-6 md:ml-14 relative">
                  <div className="hidden md:flex w-6 h-6 bg-[#3b9fd8] rounded-full items-center justify-center flex-shrink-0 absolute -left-[52px] top-1">
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[#3b9fd8] font-mono text-sm font-bold">{step.time}</span>
                      <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA inscription */}
      <section className="py-16">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-[#3b9fd8]/20 to-[#3b9fd8]/5 border border-[#3b9fd8]/30 rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <i className="fas fa-table-tennis-paddle-ball text-4xl text-[#3b9fd8] mb-6"></i>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Intéressé par un stage ?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Contactez-nous pour connaître les prochaines dates disponibles et vous inscrire.
              Places limitées pour garantir un suivi de qualité.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3b9fd8] text-white rounded-full font-bold hover:bg-[#2d8bc9] transition-colors"
              >
                <i className="fas fa-envelope"></i>
                Nous contacter
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#3b9fd8]/50 text-[#3b9fd8] rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors"
              >
                <i className="fas fa-tags"></i>
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
