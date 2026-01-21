import { SmartPingAPI } from '@/lib/smartping/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600 // Revalider toutes les heures

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EquipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const api = new SmartPingAPI()
  
  let classement: any[] = []
  let resultats: any[] = []
  let equipeInfo: any = null
  let error = null

  try {
    // Récupérer le classement de la poule (retourne XML, parsing à faire)
    const xmlResponse = await api.getClassementPoule('', id)
    
    // Parser le XML pour extraire le classement
    if (typeof xmlResponse === 'string') {
      const matches = xmlResponse.matchAll(/<classement>([\s\S]*?)<\/classement>/g)
      for (const match of matches) {
        const xml = match[1]
        classement.push({
          clt: xml.match(/<clt>([^<]*)<\/clt>/)?.[1] || '',
          equipe: xml.match(/<equipe>([^<]*)<\/equipe>/)?.[1] || '',
          joue: xml.match(/<joue>([^<]*)<\/joue>/)?.[1] || '0',
          pts: xml.match(/<pts>([^<]*)<\/pts>/)?.[1] || '0',
          numero: xml.match(/<numero>([^<]*)<\/numero>/)?.[1] || '',
          vic: xml.match(/<vic>([^<]*)<\/vic>/)?.[1] || '0',
          def: xml.match(/<def>([^<]*)<\/def>/)?.[1] || '0',
        })
      }
    }
    
    // Trouver l'info de l'équipe TLSTT dans le classement
    equipeInfo = classement.find((e: any) => e.numero === '13830083') || classement[0]
    
  } catch (e: any) {
    error = e.message
    console.error('Erreur API équipe:', e)
  }

  if (!classement.length && !error) {
    notFound()
  }

  return (
    <div className="container-custom">
      {/* Header */}
      <div className="mb-6">
        <Link href="/equipes" className="text-primary hover:underline mb-4 inline-flex items-center gap-2">
          <i className="fas fa-arrow-left"></i>
          Retour aux équipes
        </Link>
      </div>

      {/* Hero Section */}
      {equipeInfo && (
        <div className="card mb-8 bg-gradient-to-r from-primary to-blue-700 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <i className="fas fa-users mr-2"></i>
                {equipeInfo.equipe_name || 'Équipe TLSTT'}
              </h1>
              <p className="text-blue-100 text-lg">
                {equipeInfo.poule_name || `Poule ${id}`}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{equipeInfo.classement || '-'}</div>
                <div className="text-sm text-blue-100">Classement</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{equipeInfo.points || '0'}</div>
                <div className="text-sm text-blue-100">Points</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{equipeInfo.victoires || '0'}</div>
                <div className="text-sm text-blue-100">Victoires</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <i className="fas fa-exclamation-triangle text-red-500 mr-3 mt-1"></i>
            <div>
              <p className="text-red-800 font-semibold">Erreur de chargement</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement de la poule */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b-2 border-primary">
              <i className="fas fa-list-ol mr-2"></i>
              Classement de la Poule
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Pos</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Équipe</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">Pts</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">J</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">V</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">N</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classement.map((equipe: any, index: number) => {
                    const isTLSTT = equipe.club_id === '13830083'
                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 transition-colors ${
                          isTLSTT ? 'bg-blue-50 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            isTLSTT ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {equipe.classement || index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isTLSTT && <i className="fas fa-star text-yellow-500"></i>}
                            <span>{equipe.equipe_name || `Équipe ${index + 1}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-primary">
                          {equipe.points || 0}
                        </td>
                        <td className="px-4 py-3 text-center">{equipe.joues || 0}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-semibold">
                          {equipe.victoires || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {equipe.nuls || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 font-semibold">
                          {equipe.defaites || 0}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold text-primary mb-4">
              <i className="fas fa-chart-bar mr-2"></i>
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Matchs joués</span>
                <span className="font-bold text-primary">{equipeInfo?.joues || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Victoires</span>
                <span className="font-bold text-green-600">{equipeInfo?.victoires || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Nuls</span>
                <span className="font-bold text-gray-600">{equipeInfo?.nuls || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Défaites</span>
                <span className="font-bold text-red-600">{equipeInfo?.defaites || 0}</span>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              <i className="fas fa-info-circle mr-2"></i>
              Infos pratiques
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 mt-1"></i>
                <span>Données FFTT officielles</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 mt-1"></i>
                <span>Mise à jour quotidienne</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 mt-1"></i>
                <span>Résultats en temps réel</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Résultats des matchs */}
      {resultats.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b-2 border-primary">
            <i className="fas fa-calendar-check mr-2"></i>
            Résultats des Matchs
          </h2>

          <div className="space-y-4">
            {resultats.map((match: any, index: number) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">
                      {match.date ? new Date(match.date).toLocaleDateString('fr-FR') : 'Date à confirmer'}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${match.domicile ? 'text-primary' : ''}`}>
                        {match.equipe_domicile || 'Équipe A'}
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span className={`font-semibold ${!match.domicile ? 'text-primary' : ''}`}>
                        {match.equipe_exterieur || 'Équipe B'}
                      </span>
                    </div>
                  </div>
                  
                  {match.score_domicile !== null && match.score_exterieur !== null && (
                    <div className="bg-white rounded-lg px-6 py-3 font-bold text-2xl">
                      <span className={match.score_domicile > match.score_exterieur ? 'text-green-600' : 'text-gray-700'}>
                        {match.score_domicile}
                      </span>
                      <span className="text-gray-400 mx-2">-</span>
                      <span className={match.score_exterieur > match.score_domicile ? 'text-green-600' : 'text-gray-700'}>
                        {match.score_exterieur}
                      </span>
                    </div>
                  )}
                  
                  {match.score_domicile === null && (
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">
                      À venir
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
