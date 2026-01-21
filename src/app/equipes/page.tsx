import { SmartPingAPI } from '@/lib/smartping/api'
import Link from 'next/link'

export const revalidate = 3600 // Revalider toutes les heures

export default async function EquipesPage() {
  const api = new SmartPingAPI()
  
  let equipes: any[] = []
  let error = null

  try {
    // Récupérer toutes les équipes du club TLSTT
    const xmlResponse = await api.getEquipes('08830083')
    
    // Parser le XML pour extraire les équipes
    if (typeof xmlResponse === 'string') {
      const matches = xmlResponse.matchAll(/<equipe>([\s\S]*?)<\/equipe>/g)
      for (const match of matches) {
        const xml = match[1]
        equipes.push({
          libequipe: xml.match(/<libequipe>([^<]*)<\/libequipe>/)?.[1] || '',
          libdivision: xml.match(/<libdivision>([^<]*)<\/libdivision>/)?.[1] || '',
          liendivision: xml.match(/<liendivision>([^<]*)<\/liendivision>/)?.[1] || '',
          idepr: xml.match(/<idepr>([^<]*)<\/idepr>/)?.[1] || '',
          libepr: xml.match(/<libepr>([^<]*)<\/libepr>/)?.[1] || '',
          libelle_division: xml.match(/<libdivision>([^<]*)<\/libdivision>/)?.[1] || 'Autres',
        })
      }
    }
  } catch (e: any) {
    error = e.message
    console.error('Erreur API équipes:', e)
  }

  // Grouper les équipes par division
  const equipesByDivision = equipes.reduce((acc: any, equipe: any) => {
    const division = equipe.libelle_division || 'Autres'
    if (!acc[division]) {
      acc[division] = []
    }
    acc[division].push(equipe)
    return acc
  }, {})

  const divisions = Object.keys(equipesByDivision).sort()

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          <i className="fas fa-users mr-3"></i>
          Nos Équipes
        </h1>
        <p className="text-lg text-gray-600">
          Découvrez toutes les équipes du club TLSTT engagées en championnat
        </p>
      </div>

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

      {/* Statistiques globales */}
      {equipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Équipes</p>
                <p className="text-3xl font-bold text-primary">{equipes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-2xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Divisions</p>
                <p className="text-3xl font-bold text-primary">{divisions.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-trophy text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">En cours</p>
                <p className="text-3xl font-bold text-primary">
                  {equipes.filter((e: any) => e.phase === 'Championnat').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-check text-2xl text-yellow-600"></i>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Poules</p>
                <p className="text-3xl font-bold text-primary">
                  {new Set(equipes.map((e: any) => e.libelle_poule)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-layer-group text-2xl text-red-600"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des équipes par division */}
      {divisions.length > 0 ? (
        <div className="space-y-6">
          {divisions.map((division) => (
            <div key={division} className="card">
              <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b-2 border-primary">
                <i className="fas fa-trophy mr-2"></i>
                {division}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {equipesByDivision[division].map((equipe: any) => (
                  <Link
                    key={equipe.lien_division}
                    href={`/equipes/${equipe.lien_division}`}
                    className="bg-gray-50 rounded-xl p-5 hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-primary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-primary mb-2">
                          {equipe.libelle_equipe}
                        </h3>
                        <p className="text-sm text-gray-600 font-semibold">
                          <i className="fas fa-layer-group mr-2"></i>
                          {equipe.libelle_poule}
                        </p>
                      </div>
                      <div className="bg-primary text-white rounded-lg px-3 py-1 text-sm font-bold">
                        Poule {equipe.numero_poule}
                      </div>
                    </div>

                    {equipe.classement_equipe && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {equipe.classement_equipe}
                          </div>
                          <span className="text-sm text-gray-600">Classement</span>
                        </div>
                        
                        {equipe.points && (
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 text-green-800 rounded-lg px-3 py-1 font-bold">
                              {equipe.points} pts
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        <i className="fas fa-info-circle mr-1"></i>
                        {equipe.phase || 'Championnat'}
                      </span>
                      <span className="text-primary font-semibold text-sm">
                        Voir détails <i className="fas fa-arrow-right ml-1"></i>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600">Chargement des équipes...</p>
          </div>
        )
      )}

      {/* Info pratique */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
        <div className="flex items-start gap-3">
          <i className="fas fa-info-circle text-blue-600 text-2xl mt-1"></i>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Informations</h3>
            <p className="text-blue-800 text-sm">
              Les données sont mises à jour automatiquement depuis la plateforme SmartPing de la FFTT.
              Pour plus d'informations sur un match ou une équipe, cliquez sur la carte correspondante.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
