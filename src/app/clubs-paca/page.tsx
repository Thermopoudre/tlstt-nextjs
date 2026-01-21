'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Club {
  idclub: string
  numero: string
  nom: string
  validation: string
  departement: string
  departementNom: string
}

interface ClubDetail {
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

interface Departement {
  code: string
  nom: string
}

export default function ClubsPacaPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [selectedDep, setSelectedDep] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [clubDetails, setClubDetails] = useState<Record<string, ClubDetail>>({})
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)

  // Charger les clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs/paca')
        const data = await response.json()
        setClubs(data.clubs || [])
        setDepartements(data.departements || [])
      } catch (error) {
        console.error('Erreur chargement clubs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClubs()
  }, [])

  // Charger les détails d'un club
  const loadClubDetails = useCallback(async (numero: string) => {
    if (clubDetails[numero]) {
      setSelectedClub(selectedClub === numero ? null : numero)
      return
    }

    setLoadingDetails(numero)
    try {
      const response = await fetch(`/api/clubs/${numero}`)
      const data = await response.json()
      if (data.club) {
        setClubDetails(prev => ({ ...prev, [numero]: data.club }))
      }
      setSelectedClub(numero)
    } catch (error) {
      console.error('Erreur chargement détails:', error)
    } finally {
      setLoadingDetails(null)
    }
  }, [clubDetails, selectedClub])

  // Filtrer les clubs
  const filteredClubs = clubs.filter(club => {
    const matchDep = !selectedDep || club.departement === selectedDep
    const matchSearch = !searchTerm || 
      club.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.numero.includes(searchTerm)
    return matchDep && matchSearch
  })

  // Grouper par département
  const clubsByDep = filteredClubs.reduce((acc, club) => {
    if (!acc[club.departement]) {
      acc[club.departement] = []
    }
    acc[club.departement].push(club)
    return acc
  }, {} as Record<string, Club[]>)

  return (
    <div className="min-h-screen bg-[#0f3057]">
      {/* Hero */}
      <div className="py-12 bg-[#0f3057]">
        <div className="container-custom">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-white/60">
              <li><Link href="/" className="hover:text-[#5bc0de]">Accueil</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">Clubs PACA</li>
            </ol>
          </nav>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Clubs de Tennis de Table <span className="text-[#5bc0de]">PACA</span>
            </h1>
            <p className="text-white/70 text-lg">
              Tous les clubs de la région Provence-Alpes-Côte d'Azur
            </p>
          </div>

          {/* Filtres */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Rechercher</label>
                <input
                  type="text"
                  placeholder="Nom du club ou numéro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#5bc0de]"
                />
              </div>

              {/* Département */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Département</label>
                <select
                  value={selectedDep}
                  onChange={(e) => setSelectedDep(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#5bc0de]"
                >
                  <option value="" className="bg-[#0f3057]">Tous les départements</option>
                  {departements.map(dep => (
                    <option key={dep.code} value={dep.code} className="bg-[#0f3057]">
                      {dep.code} - {dep.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div className="flex items-end">
                <div className="w-full bg-[#5bc0de]/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#5bc0de]">{filteredClubs.length}</div>
                  <div className="text-white/60 text-sm">clubs trouvés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clubs */}
      <div className="container-custom pb-12 -mt-4">
        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#5bc0de] mb-4"></i>
            <p className="text-white/60">Chargement des clubs...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(clubsByDep).map(([depCode, depClubs]) => {
              const depInfo = departements.find(d => d.code === depCode)
              return (
                <div key={depCode} className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                  <div className="bg-[#5bc0de]/20 px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                      <i className="fas fa-map-marker-alt mr-2 text-[#5bc0de]"></i>
                      {depCode} - {depInfo?.nom} 
                      <span className="text-[#5bc0de] ml-2">({depClubs.length} clubs)</span>
                    </h2>
                  </div>
                  <div className="divide-y divide-white/10">
                    {depClubs.map(club => (
                      <div key={club.numero} className="hover:bg-white/5 transition-colors">
                        <button
                          onClick={() => loadClubDetails(club.numero)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between"
                        >
                          <div>
                            <div className="text-white font-semibold">{club.nom}</div>
                            <div className="text-white/50 text-sm">N° {club.numero}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {loadingDetails === club.numero ? (
                              <i className="fas fa-spinner fa-spin text-[#5bc0de]"></i>
                            ) : (
                              <i className={`fas fa-chevron-${selectedClub === club.numero ? 'up' : 'down'} text-[#5bc0de]`}></i>
                            )}
                          </div>
                        </button>

                        {/* Détails du club */}
                        {selectedClub === club.numero && clubDetails[club.numero] && (
                          <div className="px-6 pb-4 bg-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {clubDetails[club.numero].nomsalle && (
                                <div>
                                  <div className="text-white/50 text-xs uppercase">Salle</div>
                                  <div className="text-white">{clubDetails[club.numero].nomsalle}</div>
                                </div>
                              )}
                              {clubDetails[club.numero].adresse && (
                                <div>
                                  <div className="text-white/50 text-xs uppercase">Adresse</div>
                                  <div className="text-white">
                                    {clubDetails[club.numero].adresse}<br/>
                                    {clubDetails[club.numero].codePostal} {clubDetails[club.numero].ville}
                                  </div>
                                </div>
                              )}
                              {(clubDetails[club.numero].nomCorrespondant || clubDetails[club.numero].prenomCorrespondant) && (
                                <div>
                                  <div className="text-white/50 text-xs uppercase">Contact</div>
                                  <div className="text-white">
                                    {clubDetails[club.numero].prenomCorrespondant} {clubDetails[club.numero].nomCorrespondant}
                                  </div>
                                </div>
                              )}
                              {clubDetails[club.numero].telephone && (
                                <div>
                                  <div className="text-white/50 text-xs uppercase">Téléphone</div>
                                  <a href={`tel:${clubDetails[club.numero].telephone}`} className="text-[#5bc0de] hover:underline">
                                    {clubDetails[club.numero].telephone}
                                  </a>
                                </div>
                              )}
                              {clubDetails[club.numero].email && (
                                <div>
                                  <div className="text-white/50 text-xs uppercase">Email</div>
                                  <a href={`mailto:${clubDetails[club.numero].email}`} className="text-[#5bc0de] hover:underline">
                                    {clubDetails[club.numero].email}
                                  </a>
                                </div>
                              )}
                              {clubDetails[club.numero].web && (
                                <div>
                                  <div className="text-white/50 text-xs uppercase">Site web</div>
                                  <a href={clubDetails[club.numero].web.startsWith('http') ? clubDetails[club.numero].web : `https://${clubDetails[club.numero].web}`} 
                                     target="_blank" rel="noopener noreferrer" 
                                     className="text-[#5bc0de] hover:underline">
                                    {clubDetails[club.numero].web}
                                  </a>
                                </div>
                              )}
                            </div>
                            {/* Bouton Google Maps */}
                            {clubDetails[club.numero].latitude && clubDetails[club.numero].longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${clubDetails[club.numero].latitude},${clubDetails[club.numero].longitude}`}
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
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
