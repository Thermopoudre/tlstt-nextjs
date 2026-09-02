import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { getGlobalSettings } from '@/lib/settings'
import { VILLES, SALLES, trouverVille } from '@/lib/villes'
import { saisonActuelle } from '@/lib/saison'
import JsonLd from '@/components/seo/JsonLd'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { generatePageMeta, breadcrumbJsonLd, faqJsonLd, pageLocaleJsonLd } from '@/lib/seo'

export const revalidate = 3600

type Props = { params: Promise<{ ville: string }> }

export function generateStaticParams() {
  return VILLES.map(v => ({ ville: v.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville: slug } = await params
  const ville = trouverVille(slug)
  if (!ville) return { title: 'Page introuvable' }
  return generatePageMeta({
    // le gabarit du site ajoute « | TLSTT - Toulon La Seyne Tennis de Table » : on reste court
    title: `Club de tennis de table ${ville.prep}`,
    description: `Tennis de table ${ville.prep} : le TLSTT accueille les habitants de ${ville.nom} et alentours. Loisirs adultes, jeunes dès 5 ans, compétition, handisport. Première séance gratuite. Salle à ${SALLES[ville.salle].ville}.`,
    path: `/tennis-de-table/${ville.slug}`,
    keywords: [
      `tennis de table ${ville.nom}`, `club tennis de table ${ville.nom}`, `ping pong ${ville.nom}`,
      `cours tennis de table ${ville.nom}`, `club ping pong ${ville.codePostal}`, 'tennis de table Var',
      'TLSTT', 'FFTT',
    ],
  })
}

const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default async function PageVille({ params }: Props) {
  const { ville: slug } = await params
  const ville = trouverVille(slug)
  if (!ville) notFound()

  const salle = SALLES[ville.salle]
  const autreSalle = SALLES[ville.salle === 'lery' ? 'valfleuri' : 'lery']
  const supabase = createPublicClient()
  const settings = await getGlobalSettings()

  const [{ data: creneaux }, { data: tarifs }, { count: nbJoueurs }] = await Promise.all([
    supabase
      .from('trainings')
      .select('id, day_of_week, start_time, end_time, activity_name, level, description')
      .eq('is_active', true)
      .ilike('description', `%${salle.motCle}%`)
      .order('day_of_week')
      .order('start_time'),
    supabase.from('tarifs').select('label, price').eq('is_active', true).order('position').limit(4),
    supabase.from('players').select('*', { count: 'exact', head: true }).ilike('admin_notes', '%TLSTT%'),
  ])

  const voisines = ville.voisines.map(trouverVille).filter(Boolean) as typeof VILLES

  return (
    <div className="bg-[#0a0a0a]">
      <JsonLd data={[
        pageLocaleJsonLd({
          ville: ville.nom, codePostal: ville.codePostal, slug: ville.slug,
          salleNom: salle.nom, salleAdresse: salle.adresse, salleCodePostal: salle.codePostal, salleVille: salle.ville,
          telephone: settings.contact_phone || undefined, email: settings.contact_email || undefined,
        }),
        breadcrumbJsonLd([{ name: 'Accueil', url: '/' }, { name: 'Rejoindre', url: '/rejoindre' }, { name: `Tennis de table ${ville.prep}`, url: `/tennis-de-table/${ville.slug}` }]),
        faqJsonLd(ville.faq),
      ]} />

      {/* En-tête */}
      <section className="py-10 sm:py-14 border-b border-[#1e1e1e]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" items={[{ label: 'Rejoindre', href: '/rejoindre' }, { label: ville.nom }]} />
          <p className="text-[#3b9fd8] font-semibold text-sm uppercase tracking-wider mb-2">Club affilié FFTT · n° {settings.club_number || '13830083'}</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Tennis de table <span className="text-[#3b9fd8]">{ville.prep}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mt-4 max-w-3xl leading-relaxed">{ville.intro}</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/rejoindre" className="bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
              <i className="fas fa-user-plus mr-2"></i>Séance d&apos;essai gratuite
            </Link>
            <Link href="/planning" className="border border-[#3b9fd8]/60 text-[#3b9fd8] px-6 py-3 rounded-full font-semibold hover:bg-[#3b9fd8]/10 transition-colors">
              <i className="fas fa-clock mr-2"></i>Tous les horaires
            </Link>
          </div>
        </div>
      </section>

      {/* Salle + accès */}
      <section className="py-10 sm:py-14 bg-[#111111]">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-location-dot mr-3 text-[#3b9fd8]"></i>Votre salle depuis {ville.nom}
            </h2>
            <p className="text-white font-semibold text-lg">{salle.nom}</p>
            <p className="text-gray-400">{salle.adresse}, {salle.codePostal} {salle.ville}</p>
            <p className="text-gray-300 mt-4 leading-relaxed">{ville.trajet}</p>
            <p className="text-gray-400 mt-2 text-sm">{salle.acces}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salle.nom}, ${salle.adresse}, ${salle.codePostal} ${salle.ville}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-5 text-[#3b9fd8] font-semibold hover:underline"
            >
              <i className="fas fa-map mr-2"></i>Itinéraire depuis {ville.nom} →
            </a>
            <div className="mt-6 pt-6 border-t border-[#2a2a2a] text-sm text-gray-400">
              <span className="text-gray-300 font-semibold">Seconde salle du club :</span> {autreSalle.nom}, {autreSalle.adresse}, {autreSalle.codePostal} {autreSalle.ville}.
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#3b9fd8]/40 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-4"><i className="fas fa-chart-simple mr-2 text-[#3b9fd8]"></i>Le club en bref</h2>
            <ul className="space-y-3 text-gray-300">
              <li><span className="text-2xl font-extrabold text-white">{nbJoueurs || 230}+</span> licenciés</li>
              <li><span className="text-2xl font-extrabold text-white">13</span> équipes en championnat</li>
              <li><span className="text-2xl font-extrabold text-white">2</span> salles : Toulon et La Seyne</li>
              <li><span className="text-2xl font-extrabold text-white">1954</span> année de création</li>
            </ul>
            <p className="text-xs text-gray-500 mt-5">Labels FFTT : Club Formateur, Ping Santé, Club Avenir.</p>
          </div>
        </div>
      </section>

      {/* Créneaux de la salle de référence */}
      <section className="py-10 sm:py-14">
        <div className="container-custom">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              <i className="fas fa-calendar-check mr-3 text-[#3b9fd8]"></i>Horaires {ville.prep === 'à Toulon' || ville.prep === 'à La Seyne-sur-Mer' ? ville.prep : `— salle de ${salle.ville}`}
            </h2>
            <Link href="/planning" className="text-gray-400 hover:text-[#3b9fd8] font-semibold text-sm sm:text-base">Planning complet des deux salles →</Link>
          </div>
          {creneaux && creneaux.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-[#333]">
              <table className="w-full text-sm sm:text-base">
                <thead className="bg-[#1a1a1a] text-gray-400 text-left">
                  <tr><th className="px-4 py-3">Jour</th><th className="px-4 py-3">Horaire</th><th className="px-4 py-3">Activité</th><th className="px-4 py-3 hidden sm:table-cell">Public</th></tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {creneaux.map(c => (
                    <tr key={c.id} className="bg-[#0f0f0f]">
                      <td className="px-4 py-3 text-white font-semibold">{JOURS[c.day_of_week]}</td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{c.start_time?.slice(0, 5)} – {c.end_time?.slice(0, 5)}</td>
                      <td className="px-4 py-3 text-gray-200">{c.activity_name}</td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{c.level || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">Consultez le <Link href="/planning" className="text-[#3b9fd8] underline">planning complet</Link>.</p>
          )}
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-10 sm:py-14 bg-[#111111]">
        <div className="container-custom">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2"><i className="fas fa-euro-sign mr-3 text-[#3b9fd8]"></i>Tarifs saison {saisonActuelle()}</h2>
          <p className="text-gray-400 mb-6">Licence FFTT et assurance incluses. Pass&apos;Sport accepté. Première séance d&apos;essai gratuite.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(tarifs || []).map((t, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                <p className="text-gray-300 text-sm">{t.label}</p>
                <p className="text-2xl font-extrabold text-[#3b9fd8] mt-1">{Number(t.price).toFixed(0)} €<span className="text-sm text-gray-500 font-normal"> / saison</span></p>
              </div>
            ))}
          </div>
          <Link href="/tarifs" className="inline-block mt-6 text-[#3b9fd8] font-semibold hover:underline">Tous les tarifs →</Link>
        </div>
      </section>

      {/* Publics */}
      <section className="py-10 sm:py-14">
        <div className="container-custom">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Pour qui ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { icone: 'fa-child', titre: 'Enfants dès 5 ans', texte: `École de ping labellisée FFTT, créneaux en fin d’après-midi, matériel prêté. Les jeunes ${ville.prep.replace('à ', 'de ')} progressent en groupe de niveau.` },
              { icone: 'fa-users', titre: 'Adultes loisirs', texte: 'Libre accès plusieurs soirs par semaine, sans obligation de compétition. Idéal pour reprendre ou découvrir.' },
              { icone: 'fa-trophy', titre: 'Compétiteurs', texte: '13 équipes de la départementale à la nationale, critérium fédéral, entraînements dirigés par un entraîneur diplômé.' },
              { icone: 'fa-wheelchair', titre: 'Handisport', texte: 'Créneaux « Loisir / Handi » chaque semaine au complexe Léry, salle accessible. Label Ping Santé.' },
            ].map(p => (
              <div key={p.titre} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 sm:p-6">
                <div className="w-11 h-11 rounded-full bg-[#3b9fd8]/15 flex items-center justify-center mb-3"><i className={`fas ${p.icone} text-[#3b9fd8] text-lg`}></i></div>
                <h3 className="text-white font-bold mb-2">{p.titre}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ locale */}
      <section className="py-10 sm:py-14 bg-[#111111]">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6"><i className="fas fa-circle-question mr-3 text-[#3b9fd8]"></i>Questions fréquentes {ville.prep}</h2>
          <div className="space-y-3">
            {ville.faq.map((q, i) => (
              <details key={i} className="group bg-[#1a1a1a] border border-[#333] rounded-xl p-5 open:border-[#3b9fd8]/50">
                <summary className="cursor-pointer text-white font-semibold list-none flex justify-between items-center gap-4">
                  {q.question}
                  <i className="fas fa-chevron-down text-[#3b9fd8] transition-transform group-open:rotate-180"></i>
                </summary>
                <p className="text-gray-300 mt-3 leading-relaxed">{q.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Quartiers + communes voisines */}
      <section className="py-10 sm:py-14">
        <div className="container-custom">
          <p className="text-gray-500 text-sm mb-6">
            Le TLSTT accueille les joueurs de tous les quartiers de {ville.nom} : {ville.quartiers.join(', ')}.
          </p>
          <h2 className="text-xl font-bold text-white mb-4">Tennis de table dans les communes voisines</h2>
          <div className="flex flex-wrap gap-3">
            {voisines.map(v => (
              <Link key={v.slug} href={`/tennis-de-table/${v.slug}`} className="border border-[#333] hover:border-[#3b9fd8] text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm transition-colors">
                {v.nom}
              </Link>
            ))}
            <Link href="/rejoindre" className="bg-[#3b9fd8] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2d8bc9] transition-colors">Rejoindre le club →</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
