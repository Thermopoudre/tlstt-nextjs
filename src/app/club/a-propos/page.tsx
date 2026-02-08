'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClubInfo {
  nomsalle: string
  adresse: string
  codePostal: string
  ville: string
  web: string
  nomCorrespondant: string
  prenomCorrespondant: string
  email: string
  telephone: string
  latitude: string
  longitude: string
}

export default function AProposPage() {
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClubInfo = async () => {
      try {
        // Numéro du club TLSTT
        const response = await fetch('/api/clubs/13830083')
        const data = await response.json()
        if (data.club) {
          setClubInfo(data.club)
        }
      } catch (error) {
        console.error('Erreur chargement info club:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClubInfo()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li><Link href="/club" className="hover:text-[#5bc0de]">Le Club</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">À propos</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-[#5bc0de]">TLSTT</span> - Toulon La Seyne Tennis de Table
            </h1>
            <p className="text-white/70 text-lg">
              Club affilié FFTT n°13830083 - Depuis 1950
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {/* Présentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-history mr-2 text-[#5bc0de]"></i>
              Notre Histoire
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                Le <strong className="text-[#5bc0de]">Toulon La Seyne Tennis de Table (TLSTT)</strong> est un club 
                historique du Var, fondé en <strong>1950</strong>. Depuis plus de 70 ans, nous formons 
                des générations de pongistes passionnés.
              </p>
              <p>
                Affilié à la <strong>Fédération Française de Tennis de Table (FFTT)</strong> sous le numéro 
                <strong className="text-[#5bc0de]"> 13830083</strong>, le club évolue en championnats départemental, 
                régional et national.
              </p>
              <p>
                Le TLSTT est reconnu pour la qualité de son encadrement et son esprit familial. 
                Nos entraîneurs diplômés accompagnent chaque joueur dans sa progression, 
                du loisir à la compétition de haut niveau.
              </p>
            </div>
          </div>

          <div className="bg-[#5bc0de]/20 border border-[#5bc0de]/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-trophy mr-2 text-[#5bc0de]"></i>
              Palmarès
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <i className="fas fa-medal text-yellow-400 text-2xl mt-1"></i>
                <div>
                  <h3 className="font-bold text-white text-lg">Championnat Régional PACA</h3>
                  <p className="text-white/60 text-sm">Multiple participations en Régionale et Prénationale</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-medal text-gray-300 text-2xl mt-1"></i>
                <div>
                  <h3 className="font-bold text-white text-lg">Championnat du Var</h3>
                  <p className="text-white/60 text-sm">Plusieurs titres départementaux</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-star text-[#5bc0de] text-2xl mt-1"></i>
                <div>
                  <h3 className="font-bold text-white text-lg">École de Tennis de Table</h3>
                  <p className="text-white/60 text-sm">Formation des jeunes depuis plus de 30 ans</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Valeurs */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            <i className="fas fa-heart mr-2 text-[#5bc0de]"></i>
            Nos Valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/5 rounded-xl">
              <div className="w-16 h-16 bg-[#5bc0de] rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-users text-3xl text-white"></i>
              </div>
              <h3 className="font-bold text-white text-xl mb-3">Convivialité</h3>
              <p className="text-white/60">
                Un esprit familial et chaleureux où chacun trouve sa place
              </p>
            </div>

            <div className="text-center p-6 bg-white/5 rounded-xl">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-chart-line text-3xl text-white"></i>
              </div>
              <h3 className="font-bold text-white text-xl mb-3">Performance</h3>
              <p className="text-white/60">
                Un encadrement de qualité pour progresser à son rythme
              </p>
            </div>

            <div className="text-center p-6 bg-white/5 rounded-xl">
              <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-handshake text-3xl text-white"></i>
              </div>
              <h3 className="font-bold text-white text-xl mb-3">Fair-play</h3>
              <p className="text-white/60">
                Le respect de l'adversaire et des règles avant tout
              </p>
            </div>
          </div>
        </div>

        {/* Infos pratiques depuis API */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-dumbbell mr-2 text-[#5bc0de]"></i>
              Nos Équipements
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
                <span className="text-white"><strong className="text-[#5bc0de]">12 tables</strong> de compétition homologuées FFTT</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
                <span className="text-white"><strong className="text-[#5bc0de]">800m²</strong> de surface de jeu</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
                <span className="text-white">Vestiaires et douches</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
                <span className="text-white">Local de rangement sécurisé</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
                <span className="text-white">Parking gratuit à proximité</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
                <span className="text-white">Accès PMR</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              <i className="fas fa-map-marker-alt mr-2 text-[#5bc0de]"></i>
              Nous Trouver
            </h2>
            {isLoading ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-[#5bc0de]"></i>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-building text-[#5bc0de] text-xl mt-1"></i>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Salle</h3>
                    <p className="text-white/70">
                      {clubInfo?.nomsalle || 'Gymnase Léo Lagrange'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-map text-[#5bc0de] text-xl mt-1"></i>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Adresse</h3>
                    <p className="text-white/70">
                      {clubInfo?.adresse || 'Avenue Maréchal Juin'}<br/>
                      {clubInfo?.codePostal || '83500'} {clubInfo?.ville || 'La Seyne-sur-Mer'}
                    </p>
                  </div>
                </div>
                {clubInfo?.telephone && (
                  <div className="flex items-start gap-3">
                    <i className="fas fa-phone text-[#5bc0de] text-xl mt-1"></i>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Téléphone</h3>
                      <a href={`tel:${clubInfo.telephone}`} className="text-[#5bc0de] hover:underline">
                        {clubInfo.telephone}
                      </a>
                    </div>
                  </div>
                )}
                {clubInfo?.email && (
                  <div className="flex items-start gap-3">
                    <i className="fas fa-envelope text-[#5bc0de] text-xl mt-1"></i>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Email</h3>
                      <a href={`mailto:${clubInfo.email}`} className="text-[#5bc0de] hover:underline">
                        {clubInfo.email}
                      </a>
                    </div>
                  </div>
                )}
                {clubInfo?.web && (
                  <div className="flex items-start gap-3">
                    <i className="fas fa-globe text-[#5bc0de] text-xl mt-1"></i>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Site web</h3>
                      <a href={clubInfo.web.startsWith('http') ? clubInfo.web : `https://${clubInfo.web}`} 
                         target="_blank" rel="noopener noreferrer" 
                         className="text-[#5bc0de] hover:underline">
                        {clubInfo.web}
                      </a>
                    </div>
                  </div>
                )}
                {clubInfo?.latitude && clubInfo?.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${clubInfo.latitude},${clubInfo.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#5bc0de] text-white rounded-lg hover:bg-[#4ab0ce] transition-colors"
                  >
                    <i className="fas fa-map-marker-alt"></i>
                    Voir sur Google Maps
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="bg-[#5bc0de]/20 border border-[#5bc0de]/30 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Le TLSTT en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">70+</div>
              <div className="text-white/70">Années d'existence</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">150+</div>
              <div className="text-white/70">Licenciés</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">8</div>
              <div className="text-white/70">Équipes engagées</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#5bc0de] mb-2">4</div>
              <div className="text-white/70">Entraîneurs diplômés</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#5bc0de] text-white rounded-full font-bold text-lg hover:bg-[#4ab0ce] transition-colors">
            <i className="fas fa-envelope"></i>
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  )
}
