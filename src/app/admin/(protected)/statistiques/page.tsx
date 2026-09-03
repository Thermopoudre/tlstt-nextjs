'use client'

import { useEffect, useState } from 'react'

type Periode = 'semaine' | 'mois' | 'trimestre' | 'annee'

interface Stats {
  periode: Periode
  jours: number
  depuis: string
  visitesPrecedentes: number
  premier_jour: string | null
  total: {
    visites: number; visiteurs: number; sessions: number
    anonymes: number; membres: number
    visites_anonymes: number; visites_membres: number
  }
  periodes: { periode: string; visites: number; visiteurs: number; visites_anonymes: number; visites_membres: number }[]
  pages: { chemin: string; titre: string | null; visites: number; visiteurs: number }[]
  sources: { source: string; visites: number; visiteurs: number }[]
  appareils: { appareil: string; visites: number; visiteurs: number }[]
  actions: { type: string; total: number }[]
}

const LIBELLES_PERIODE: Record<Periode, string> = {
  semaine: '7 derniers jours',
  mois: '30 derniers jours',
  trimestre: '3 derniers mois',
  annee: '12 derniers mois',
}

const LIBELLES_SOURCE: Record<string, string> = {
  direct: 'Accès direct (lien, favori, QR code)',
  google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo',
  facebook: 'Facebook', instagram: 'Instagram', twitter: 'X (Twitter)',
  linkedin: 'LinkedIn', youtube: 'YouTube', whatsapp: 'WhatsApp', fftt: 'Site de la FFTT',
}

const LIBELLES_ACTION: Record<string, string> = {
  contact: 'Formulaires de contact envoyés',
  newsletter: 'Inscriptions à la newsletter',
  inscription: 'Créations de compte',
}

const ICONES_APPAREIL: Record<string, string> = {
  mobile: 'fa-mobile-screen', tablette: 'fa-tablet-screen-button', ordinateur: 'fa-desktop',
}

function formaterPeriode(valeur: string, granularite: Periode): string {
  const d = new Date(valeur + 'T12:00:00')
  if (granularite === 'annee') return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
  if (granularite === 'trimestre') return 'sem. ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function StatistiquesPage() {
  const [periode, setPeriode] = useState<Periode>('mois')
  const [stats, setStats] = useState<Stats | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let vivant = true
    setChargement(true)
    setErreur('')
    fetch(`/api/admin/stats?periode=${periode}`)
      .then(r => r.json())
      .then(d => { if (!vivant) return; d.error ? setErreur(d.error) : setStats(d) })
      .catch(() => vivant && setErreur('Impossible de charger les statistiques.'))
      .finally(() => vivant && setChargement(false))
    return () => { vivant = false }
  }, [periode])

  const total = stats?.total
  const evolution = stats && stats.visitesPrecedentes > 0
    ? Math.round(((total!.visites - stats.visitesPrecedentes) / stats.visitesPrecedentes) * 100)
    : null

  const maxVisites = Math.max(1, ...(stats?.periodes || []).map(p => Number(p.visites)))
  const totalAppareils = Math.max(1, (stats?.appareils || []).reduce((s, a) => s + Number(a.visites), 0))
  const totalSources = Math.max(1, (stats?.sources || []).reduce((s, a) => s + Number(a.visites), 0))

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            <i className="fas fa-chart-line mr-2 text-primary"></i>
            Statistiques de fréquentation
          </h1>
          <p className="text-gray-600 mt-1">Qui visite le site, d&apos;où viennent les visiteurs, et ce qu&apos;ils regardent.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LIBELLES_PERIODE) as Periode[]).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                periode === p ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {LIBELLES_PERIODE[p]}
            </button>
          ))}
        </div>
      </div>

      {erreur && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i>{erreur}
        </div>
      )}

      {chargement && !stats && (
        <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>
      )}

      {stats && total && (
        <>
          {total.visites === 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-5">
              <p className="font-semibold mb-1"><i className="fas fa-hourglass-start mr-2"></i>La mesure vient de démarrer</p>
              <p className="text-sm">Les visites sont comptées à partir d&apos;aujourd&apos;hui. Revenez dans quelques jours : le graphique se remplira au fil des visites.</p>
            </div>
          )}

          {/* Chiffres clés */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-500">
              <div className="text-3xl font-bold text-gray-900">{total.visites}</div>
              <div className="text-gray-600 text-sm">Pages vues</div>
              {evolution !== null && (
                <div className={`text-xs mt-1 font-semibold ${evolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <i className={`fas ${evolution >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                  {Math.abs(evolution)} % vs période précédente
                </div>
              )}
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-emerald-500">
              <div className="text-3xl font-bold text-gray-900">{total.visiteurs}</div>
              <div className="text-gray-600 text-sm">Visiteurs différents</div>
              <div className="text-xs text-gray-400 mt-1">comptés une fois par jour</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-amber-500">
              <div className="text-3xl font-bold text-gray-900">{total.anonymes}</div>
              <div className="text-gray-600 text-sm">Visiteurs sans compte</div>
              <div className="text-xs text-gray-400 mt-1">{total.visites_anonymes} pages vues</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-purple-500">
              <div className="text-3xl font-bold text-gray-900">{total.membres}</div>
              <div className="text-gray-600 text-sm">Visiteurs connectés</div>
              <div className="text-xs text-gray-400 mt-1">{total.visites_membres} pages vues</div>
            </div>
          </div>

          {/* Courbe */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold text-gray-900 mb-4">
              <i className="fas fa-chart-column mr-2 text-primary"></i>
              Fréquentation — {LIBELLES_PERIODE[periode].toLowerCase()}
            </h2>
            {stats.periodes.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">Aucune visite enregistrée sur cette période.</p>
            ) : (
              <div className="flex items-end gap-1 h-56 overflow-x-auto">
                {stats.periodes.map(p => {
                  const h = Math.round((Number(p.visites) / maxVisites) * 100)
                  const hMembres = Number(p.visites) > 0 ? Math.round((Number(p.visites_membres) / Number(p.visites)) * h) : 0
                  return (
                    <div key={p.periode} className="flex-1 min-w-[18px] flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                        {p.visites} vues · {p.visiteurs} visiteurs
                      </div>
                      <div className="w-full rounded-t bg-[#3b9fd8] relative" style={{ height: `${Math.max(h, 2)}%` }}>
                        <div className="absolute bottom-0 left-0 right-0 rounded-b bg-purple-500" style={{ height: `${hMembres}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 rotate-0 whitespace-nowrap">{formaterPeriode(p.periode, periode)}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-4 text-xs text-gray-500 mt-3">
              <span><span className="inline-block w-3 h-3 rounded-sm bg-[#3b9fd8] mr-1 align-middle"></span>Visiteurs sans compte</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-purple-500 mr-1 align-middle"></span>Membres connectés</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pages */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold text-gray-900 mb-4"><i className="fas fa-file-lines mr-2 text-primary"></i>Pages les plus vues</h2>
              {stats.pages.length === 0 ? <p className="text-gray-500 text-sm">Aucune donnée.</p> : (
                <ul className="space-y-2">
                  {stats.pages.map(p => (
                    <li key={p.chemin} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2 last:border-0">
                      <a href={p.chemin} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary truncate">
                        {p.chemin === '/' ? 'Accueil' : p.chemin}
                      </a>
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{p.visites}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sources */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold text-gray-900 mb-4"><i className="fas fa-signs-post mr-2 text-primary"></i>D&apos;où viennent les visiteurs</h2>
              {stats.sources.length === 0 ? <p className="text-gray-500 text-sm">Aucune donnée.</p> : (
                <ul className="space-y-3">
                  {stats.sources.map(s => {
                    const pct = Math.round((Number(s.visites) / totalSources) * 100)
                    return (
                      <li key={s.source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{LIBELLES_SOURCE[s.source] || s.source}</span>
                          <span className="font-semibold text-gray-900">{pct} %</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#3b9fd8] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Appareils */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold text-gray-900 mb-4"><i className="fas fa-mobile-screen mr-2 text-primary"></i>Mobile ou ordinateur</h2>
              {stats.appareils.length === 0 ? <p className="text-gray-500 text-sm">Aucune donnée.</p> : (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {['mobile', 'ordinateur', 'tablette'].map(a => {
                    const ligne = stats.appareils.find(x => x.appareil === a)
                    const pct = Math.round(((Number(ligne?.visites) || 0) / totalAppareils) * 100)
                    return (
                      <div key={a} className="p-4 rounded-lg bg-gray-50">
                        <i className={`fas ${ICONES_APPAREIL[a]} text-2xl text-primary mb-2`}></i>
                        <div className="text-2xl font-bold text-gray-900">{pct} %</div>
                        <div className="text-xs text-gray-500 capitalize">{a}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold text-gray-900 mb-4"><i className="fas fa-bullseye mr-2 text-primary"></i>Ce que font les visiteurs</h2>
              {stats.actions.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune action enregistrée sur la période (contact, newsletter, création de compte).</p>
              ) : (
                <ul className="space-y-2">
                  {stats.actions.map(a => (
                    <li key={a.type} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                      <span className="text-gray-700">{LIBELLES_ACTION[a.type] || a.type}</span>
                      <span className="font-semibold text-gray-900">{a.total}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-400 mt-4">
                La page « Rejoindre le club » apparaît dans les pages les plus vues : c&apos;est le meilleur indicateur d&apos;intérêt pour une adhésion.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Mesure interne, sans cookie et sans conserver d&apos;adresse IP : un visiteur est reconnu par une empreinte anonyme qui change chaque jour.
            Les robots et les pages du back-office ne sont pas comptés.
            {stats.premier_jour && ` Mesure démarrée le ${new Date(stats.premier_jour + 'T12:00:00').toLocaleDateString('fr-FR')}.`}
          </p>
        </>
      )}
    </div>
  )
}
