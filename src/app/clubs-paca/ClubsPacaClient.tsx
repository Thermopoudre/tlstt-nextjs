'use client'

import { useEffect, useState, useCallback } from 'react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

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

export default function ClubsPacaClient() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [selectedDep, setSelectedDep] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [clubDetails, setClubDetails] = useState<Record<string, ClubDetail>>({})
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)

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

  const filteredClubs = clubs.filter(club => {
    const matchDep = !selectedDep || club.departement === selectedDep
    const matchSearch = !searchTerm ||
      club.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.numero.includes(searchTerm)
    return matchDep && matchSearch
  })

  const clubsByDep = filteredClubs.reduce((acc, club) => {
    if (!acc[club.departement]) {
      acc[club.departement] = []
    }
    acc[club.departement].push(club)
    return acc
  }, {} as Record<string, Club[]>)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a] border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-map-marked-alt text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Clubs de Tennis de Table <span className="text-[#3b9fd8]">PACA</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tous les clubs de la région Provence-Alpes-Côte d&apos;Azur
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Rechercher</label>
              <input
                type="text"
                placeholder="Nom du club ou numéro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#333] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Département</label>
              <select
                value={selectedDep}
                onChange={(e) => setSelectedDep(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#333] rounded-xl text-white focus:outline-none focus:border-[#3b9fd8] transition-colors"
              >
                <option value="" className="bg-[#0a0a0a]">Tous les départements</option>
                {departements.map(dep => (
                  <option key={dep.code} value={dep.code} className="bg-[#0a0a0a]">
                    {dep.code} - {dep.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full bg-[#3b9fd8]/10 border border-[#3b9fd8]/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-[#3b9fd8]">{filteredClubs.length}</div>
                <div className="text-gray-500 text-sm">clubs trouvés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des clubs */}
        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8] mb-4"></i>
            <p className="text-gray-500">Chargement des clubs...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(clubsByDep).map(([depCode, depClubs]) => {
              const depInfo = departements.find(d => d.code === depCode)
              return (
                <div key={depCode} className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
                  <div className="bg-[#3b9fd8]/10 px-6 py-4 border-b border-[#333]">
                    <h2 className="text-xl font-bold text-white">
                      <i className="fas fa-map-marker-alt mr-2 text-[#3b9fd8]"></i>
                      {depCode} - {depInfo?.nom}
                      <span className="text-[#3b9fd8] ml-2">({depClubs.length} clubs)</span>
                    </h2>
                  </div>
                  <div className="divide-y divide-[#333]">
                    {depClubs.map(club => (
                      <div key={club.numero} className="hover:bg-[#222] transition-colors">
                        <button
                          onClick={() => loadClubDetails(club.numero)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between"
                        >
                          <div>
                            <div className="text-white font-semibold">{club.nom}</div>
                            <div className="text-gray-500 text-sm">N° {club.numero}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {loadingDetails === club.numero ? (
                              <i className="fas fa-spinner fa-spin text-[#3b9fd8]"></i>
                            ) : (
                              <i className={`fas fa-chevron-${selectedClub === club.numero ? 'up' : 'down'} text-[#3b9fd8]`}></i>
                            )}
                          </div>
                        </button>

                        {selectedClub === club.numero && clubDetails[club.numero] && (
                          <div className="px-6 pb-4 bg-[#111]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {clubDetails[club.numero].nomsalle && (
                                <div>
                                  <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Salle</div>
                                  <div className="text-white">{clubDetails[club.numero].nomsalle}</div>
                                </div>
                              )}
                              {clubDetails[club.numero].adresse && (
                                <div>
                                  <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Adresse</div>
                                  <div className="text-white">
                                    {clubDetails[club.numero].adresse}<br />
                                    {clubDetails[club.numero].codePostal} {clubDetails[club.numero].ville}
                                  </div>
                                </div>
                              )}
                              {(clubDetails[club.numero].nomCorrespondant || clubDetails[club.numero].prenomCorrespondant) && (
                                <div>
                                  <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Contact</div>
                                  <div className="text-white">
                                    {clubDetails[club.numero].prenomCorrespondant} {clubDetails[club.numero].nomCorrespondant}
                                  </div>
                                </div>
                              )}
                              {clubDetails[club.numero].telephone && (
                                <div>
                                  <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Téléphone</div>
                                  <a href={`tel:${clubDetails[club.numero].telephone}`} className="text-[#3b9fd8] hover:underline">
                                    {clubDetails[club.numero].telephone}
                                  </a>
                                </div>
                              )}
                              {clubDetails[club.numero].email && (
                                <div>
                                  <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Email</div>
                                  <a href={`mailto:${clubDetails[club.numero].email}`} className="text-[#3b9fd8] hover:underline">
                                    {clubDetails[club.numero].email}
                                  </a>
                                </div>
                              )}
                              {clubDetails[club.numero].web && (
                                <div>
                                  <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Site web</div>
                                  <a
                                    href={clubDetails[club.numero].web.startsWith('http') ? clubDetails[club.numero].web : `https://${clubDetails[club.numero].web}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#3b9fd8] hover:underline"
                                  >
                                    {clubDetails[club.numero].web}
                                  </a>
                                </div>
                              )}
                            </div>
                            {clubDetails[club.numero].latitude && clubDetails[club.numero].longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${clubDetails[club.numero].latitude},${clubDetails[club.numero].longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#3b9fd8] text-white rounded-lg hover:bg-[#2d8bc9] transition-colors"
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
