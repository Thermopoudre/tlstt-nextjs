import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Compétitions - Résultats et Calendrier',
  description: 'Calendrier et résultats des compétitions de tennis de table du TLSTT. Tournois, championnats FFTT et rencontres à venir à Toulon La Seyne-sur-Mer.',
  alternates: { canonical: '/competitions' },
  openGraph: {
    title: 'Compétitions TLSTT',
    description: 'Résultats et calendrier des compétitions du club de tennis de table TLSTT.',
    url: '/competitions',
  },
  keywords: ['compétitions', 'résultats', 'tournoi', 'tennis de table', 'TLSTT', 'championnat', 'FFTT'],
}

export default async function CompetitionsPage() {
  const supabase = await createClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .order('date', { ascending: false })

  const aVenir = competitions?.filter(c => c.status === 'upcoming') || []
  const passees = competitions?.filter(c => c.status === 'completed') || []

  const stats = {
    total: competitions?.length || 0,
    wins: passees.filter(c => c.score_for > c.score_against).length,
    losses: passees.filter(c => c.score_for < c.score_against).length,
    draws: passees.filter(c => c.score_for === c.score_against && c.score_for !== null).length,
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/" className="hover:text-[#3b9fd8]">Accueil</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Competitions</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-[#3b9fd8]">Calendrier</span> des Competitions
            </h1>
            <p className="text-gray-400 text-lg">
              Toutes les rencontres officielles du TLSTT
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#3b9fd8]">{stats.total}</p>
              <p className="text-sm text-gray-500">Rencontres</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
              <p className="text-sm text-gray-500">Victoires</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
              <p className="text-sm text-gray-500">Defaites</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.draws}</p>
              <p className="text-sm text-gray-500">Nuls</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12">
        {/* Prochaines rencontres */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <i className="fas fa-calendar-alt text-[#3b9fd8]"></i>
            A venir ({aVenir.length})
          </h2>

          {aVenir.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-2xl">
              <i className="fas fa-calendar-check text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-2">Aucune competition a venir</h3>
              <p className="text-gray-500">Les prochaines dates seront affichees ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aVenir.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(comp => (
                <div key={comp.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 hover:border-[#3b9fd8]/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#3b9fd8] text-white px-4 py-2 rounded-xl text-center min-w-[80px]">
                        <div className="text-2xl font-bold">{new Date(comp.date).getDate()}</div>
                        <div className="text-xs">{new Date(comp.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                      </div>
                      <div>
                        <div className="text-[#3b9fd8] font-bold text-lg">{comp.team_name}</div>
                        <div className="text-white">
                          {comp.type === 'domicile' ? (
                            <><span className="text-green-400">TLSTT</span> vs {comp.opponent}</>
                          ) : (
                            <>{comp.opponent} vs <span className="text-green-400">TLSTT</span></>
                          )}
                        </div>
                        <div className="text-gray-500 text-sm flex items-center gap-3">
                          {comp.division && <span>{comp.division}</span>}
                          {comp.time && <span><i className="fas fa-clock mr-1"></i>{comp.time.slice(0, 5)}</span>}
                          {comp.location && <span><i className="fas fa-map-marker-alt mr-1"></i>{comp.location}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                      comp.type === 'domicile' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      <i className={`fas ${comp.type === 'domicile' ? 'fa-home' : 'fa-car'}`}></i>
                      {comp.type === 'domicile' ? 'Domicile' : 'Exterieur'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resultats */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <i className="fas fa-trophy text-[#3b9fd8]"></i>
            Resultats ({passees.length})
          </h2>

          {passees.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-2xl">
              <i className="fas fa-trophy text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-2">Aucun resultat</h3>
              <p className="text-gray-500">Les resultats des competitions passees apparaitront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passees.map(comp => {
                const victoire = comp.score_for > comp.score_against
                const defaite = comp.score_for < comp.score_against

                return (
                  <div key={comp.id} className={`border rounded-2xl p-6 ${
                    victoire ? 'bg-green-500/10 border-green-500/30' :
                    defaite ? 'bg-red-500/10 border-red-500/30' :
                    'bg-[#1a1a1a] border-[#333]'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-xl text-center min-w-[80px] ${
                          victoire ? 'bg-green-500 text-white' :
                          defaite ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          <div className="text-2xl font-bold">{comp.result || '-'}</div>
                          <div className="text-xs">{victoire ? 'VICTOIRE' : defaite ? 'DEFAITE' : 'NUL'}</div>
                        </div>
                        <div>
                          <div className="text-[#3b9fd8] font-bold text-lg">{comp.team_name}</div>
                          <div className="text-white">
                            {comp.type === 'domicile' ? (
                              <><span className="text-green-400">TLSTT</span> vs {comp.opponent}</>
                            ) : (
                              <>{comp.opponent} vs <span className="text-green-400">TLSTT</span></>
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">{comp.division}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {new Date(comp.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Lien equipes */}
        <div className="mt-12 text-center">
          <Link href="/equipes" className="inline-flex items-center gap-2 px-6 py-3 bg-[#3b9fd8] text-white rounded-full font-semibold hover:bg-[#2d8bc9] transition-colors">
            <i className="fas fa-users"></i>
            Voir les classements des equipes
          </Link>
        </div>
      </div>
    </div>
  )
}
