import Image from 'next/image'
import { createPublicClient } from '@/lib/supabase/public'

/**
 * Labels FFTT du club.
 *
 * Rendu côté serveur : les vrais labels sont dans la page dès le premier
 * affichage (avant, une liste d'exemples s'affichait le temps du chargement —
 * les visiteurs et Google voyaient de faux labels).
 */

interface Label {
  id: string
  name: string
  description: string | null
  image_url: string | null
  display_order: number
  etoiles: number
}

const ICONES_LABEL: Record<string, { icon: string; gradient: string }> = {
  avenir: { icon: 'fas fa-seedling', gradient: 'from-blue-500 to-blue-700' },
  responsable: { icon: 'fas fa-leaf', gradient: 'from-emerald-500 to-emerald-700' },
  citoyen: { icon: 'fas fa-handshake-angle', gradient: 'from-indigo-500 to-indigo-700' },
  performance: { icon: 'fas fa-trophy', gradient: 'from-rose-500 to-rose-700' },
  école: { icon: 'fas fa-graduation-cap', gradient: 'from-blue-500 to-blue-700' },
  formateur: { icon: 'fas fa-chalkboard-user', gradient: 'from-green-500 to-green-700' },
  santé: { icon: 'fas fa-heart-pulse', gradient: 'from-red-400 to-pink-600' },
}

function styleDuLabel(nom: string) {
  const n = nom.toLowerCase()
  for (const [cle, style] of Object.entries(ICONES_LABEL)) {
    if (n.includes(cle)) return style
  }
  return { icon: 'fas fa-award', gradient: 'from-[#3b9fd8] to-blue-700' }
}

/** Une adresse locale (file:///…, C:\…) collée depuis un ordinateur ne s'affiche jamais chez les visiteurs. */
function imageInutilisable(url: string | null) {
  const u = (url || '').trim()
  return !u || u.includes('placeholder') || /^(file:|[a-zA-Z]:\\)/.test(u)
}

export default async function LabelsSection() {
  let labels: Label[] = []
  try {
    const { data, error } = await createPublicClient()
      .from('labels')
      .select('id, name, description, image_url, display_order, etoiles')
      .eq('is_active', true)
      .order('display_order')
    if (error) console.error('[LabelsSection] lecture impossible :', error.message)
    labels = (data as Label[]) || []
  } catch (e) {
    console.error('[LabelsSection] erreur inattendue :', e)
  }

  if (labels.length === 0) return null

  return (
    <section className="py-16 bg-[#111111]">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            <i className="fas fa-award mr-3 text-[#3b9fd8]"></i>
            Nos Labels FFTT
          </h2>
          <p className="text-gray-500">Certifications et engagements qualité décernés par la Fédération</p>
        </div>

        <div className="flex flex-wrap justify-center items-stretch gap-8 md:gap-10">
          {labels.map((label) => {
            const style = styleDuLabel(label.name)
            const badge = imageInutilisable(label.image_url)
            return (
              <div key={label.id} className="group relative flex flex-col items-center w-44 md:w-52">
                <div className="w-36 h-36 md:w-44 md:h-44 relative rounded-2xl shadow-lg border border-[#333] hover:border-[#3b9fd8] transition-all hover:shadow-[0_0_20px_rgba(59,159,216,0.3)] hover:scale-105 overflow-hidden">
                  {badge ? (
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center p-4`}>
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center mb-2 border-2 border-white/40">
                        <i className={`${style.icon} text-3xl md:text-4xl text-white`}></i>
                      </div>
                      <div className="text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight">FFTT</div>
                    </div>
                  ) : (
                    <Image src={label.image_url as string} alt={label.name} fill className="object-contain p-3" />
                  )}
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-sm font-semibold text-white leading-tight">{label.name}</h3>
                  {label.etoiles > 0 && (
                    <div className="mt-1.5 flex items-center justify-center gap-1" aria-label={`${label.etoiles} étoile${label.etoiles > 1 ? 's' : ''}`}>
                      {Array.from({ length: label.etoiles }).map((_, i) => (
                        <i key={i} className="fas fa-star text-[#f5b301] text-sm"></i>
                      ))}
                    </div>
                  )}
                </div>

                {label.description && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[#3b9fd8] text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-lg">
                    {label.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#3b9fd8]"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-500 text-sm mt-10">
          Ces labels sont délivrés par la{' '}
          <a href="https://www.fftt.com/site/jouer/services-clubs/labels-clubs" target="_blank" rel="noopener noreferrer" className="text-[#3b9fd8] hover:underline">
            Fédération Française de Tennis de Table
          </a>{' '}
          et sont valables trois ans.
        </p>
      </div>
    </section>
  )
}
