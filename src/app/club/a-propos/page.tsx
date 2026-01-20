import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export default async function AProposPage() {
  const supabase = await createClient()

  // Récupérer les paramètres du club
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .in('key', ['club_name', 'club_description', 'club_founded', 'club_address', 'club_phone', 'club_email'])

  const settingsMap = settings?.reduce((acc: any, item) => {
    acc[item.key] = item.value
    return acc
  }, {}) || {}

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          <i className="fas fa-info-circle mr-3"></i>
          À Propos du Club
        </h1>
        <p className="text-lg text-gray-600">
          Découvrez l'histoire et les valeurs du TLSTT
        </p>
      </div>

      {/* Section Histoire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b-2 border-primary">
            <i className="fas fa-history mr-2"></i>
            Notre Histoire
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Le <strong>Toulon La Seyne Tennis de Table (TLSTT)</strong> est un club historique du Var, 
              fondé en <strong>{settingsMap.club_founded || '1950'}</strong>. Depuis plus de 70 ans, nous formons 
              des générations de pongistes passionnés.
            </p>
            <p>
              Affilié à la <strong>Fédération Française de Tennis de Table (FFTT)</strong>, le club compte aujourd'hui 
              plus de <strong>200 licenciés</strong> de tous âges et tous niveaux.
            </p>
            <p>
              Le TLSTT est reconnu pour la qualité de son encadrement et son esprit familial. 
              Nos entraîneurs diplômés accompagnent chaque joueur dans sa progression, 
              du loisir à la compétition de haut niveau.
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary to-blue-700 text-white">
          <h2 className="text-2xl font-bold mb-6 pb-4 border-b-2 border-white/30">
            <i className="fas fa-trophy mr-2"></i>
            Palmarès
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <i className="fas fa-medal text-yellow-300 text-2xl mt-1"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Championnat Régional</h3>
                <p className="text-blue-100 text-sm">3 titres régionaux (2018, 2020, 2023)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <i className="fas fa-medal text-gray-300 text-2xl mt-1"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Coupe de Provence</h3>
                <p className="text-blue-100 text-sm">Finaliste 2022</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <i className="fas fa-star text-cyan-300 text-2xl mt-1"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Label École Française de Tennis de Table</h3>
                <p className="text-blue-100 text-sm">Certifié depuis 2019</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Valeurs */}
      <div className="card mb-12">
        <h2 className="text-2xl font-bold text-primary mb-8 pb-4 border-b-2 border-primary">
          <i className="fas fa-heart mr-2"></i>
          Nos Valeurs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-users text-3xl text-white"></i>
            </div>
            <h3 className="font-bold text-primary text-xl mb-3">Convivialité</h3>
            <p className="text-gray-600">
              Un esprit familial et chaleureux où chacun trouve sa place
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-chart-line text-3xl text-white"></i>
            </div>
            <h3 className="font-bold text-primary text-xl mb-3">Performance</h3>
            <p className="text-gray-600">
              Un encadrement de qualité pour progresser à son rythme
            </p>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-handshake text-3xl text-white"></i>
            </div>
            <h3 className="font-bold text-primary text-xl mb-3">Fair-play</h3>
            <p className="text-gray-600">
              Le respect de l'adversaire et des règles avant tout
            </p>
          </div>
        </div>
      </div>

      {/* Équipements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b-2 border-primary">
            <i className="fas fa-dumbbell mr-2"></i>
            Nos Équipements
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
              <span className="text-gray-700"><strong>12 tables</strong> de compétition homologuées FFTT</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
              <span className="text-gray-700"><strong>Gymnase Léo Lagrange</strong> - 800m² de surface</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
              <span className="text-gray-700">Vestiaires et douches</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
              <span className="text-gray-700">Local de rangement sécurisé</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
              <span className="text-gray-700">Parking gratuit à proximité</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
              <span className="text-gray-700">Accès PMR (Personnes à Mobilité Réduite)</span>
            </li>
          </ul>
        </div>

        <div className="card bg-gray-50">
          <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b-2 border-primary">
            <i className="fas fa-map-marker-alt mr-2"></i>
            Nous Trouver
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-building text-primary text-xl mt-1"></i>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Adresse</h3>
                <p className="text-gray-600">
                  Gymnase Léo Lagrange<br />
                  Avenue Maréchal Juin<br />
                  83000 Toulon
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-phone text-primary text-xl mt-1"></i>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Téléphone</h3>
                <a href="tel:0612345678" className="text-secondary hover:underline">
                  {settingsMap.club_phone || '06 12 34 56 78'}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-envelope text-primary text-xl mt-1"></i>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                <a href="mailto:contact@tlstt.fr" className="text-secondary hover:underline">
                  {settingsMap.club_email || 'contact@tlstt.fr'}
                </a>
              </div>
            </div>
            <a
              href="https://maps.google.com/?q=Gymnase+Léo+Lagrange+Toulon"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 mt-4"
            >
              <i className="fas fa-map-marked-alt"></i>
              Voir sur Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="card bg-gradient-to-r from-primary to-blue-700 text-white">
        <h2 className="text-3xl font-bold mb-8 text-center">Le TLSTT en chiffres</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">70+</div>
            <div className="text-blue-100">Années d'existence</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">200+</div>
            <div className="text-blue-100">Licenciés</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">12</div>
            <div className="text-blue-100">Équipes engagées</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">6</div>
            <div className="text-blue-100">Entraîneurs diplômés</div>
          </div>
        </div>
      </div>
    </div>
  )
}
