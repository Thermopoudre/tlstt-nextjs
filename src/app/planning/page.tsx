import { createClient } from '@/lib/supabase/server'

export default async function PlanningPage() {
  const supabase = await createClient()

  // Récupérer tous les créneaux actifs
  const { data: trainings } = await supabase
    .from('trainings')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  // Organiser par jour de la semaine
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const trainingsByDay = days.reduce((acc, day, index) => {
    acc[day] = trainings?.filter(t => t.day_of_week === index + 1) || []
    return acc
  }, {} as Record<string, any[]>)

  // Types d'activités avec couleurs et emojis
  const activityTypes = {
    jeunes: { label: 'Jeunes', color: 'bg-green-100 text-green-800 border-green-300', emoji: '🎓' },
    dirige: { label: 'Dirigé', color: 'bg-blue-100 text-blue-800 border-blue-300', emoji: '🎯' },
    libre: { label: 'Libre', color: 'bg-gray-100 text-gray-800 border-gray-300', emoji: '🏓' },
    loisirs: { label: 'Loisirs', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: '😊' },
    individuel: { label: 'Individuel', color: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '⭐' },
    competition: { label: 'Compétition', color: 'bg-red-100 text-red-800 border-red-300', emoji: '🏆' },
    handisport: { label: 'Handisport', color: 'bg-orange-100 text-orange-800 border-orange-300', emoji: '♿' },
  }

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          <i className="fas fa-calendar-alt mr-3"></i>
          Planning des Entraînements
        </h1>
        <p className="text-lg text-gray-600">
          Retrouvez tous nos créneaux d'entraînement hebdomadaires
        </p>
      </div>

      {/* Légende */}
      <div className="card mb-8">
        <h3 className="text-xl font-bold text-primary mb-4">
          <i className="fas fa-info-circle mr-2"></i>
          Légende
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(activityTypes).map(([key, type]) => (
            <div key={key} className={`px-4 py-2 rounded-lg border-2 ${type.color} text-center font-semibold`}>
              <span className="text-2xl mr-2">{type.emoji}</span>
              {type.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau Planning */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Jour</th>
                <th className="px-4 py-3 text-left font-bold">Horaires</th>
                <th className="px-4 py-3 text-left font-bold">Activité</th>
                <th className="px-4 py-3 text-left font-bold">Niveau / Public</th>
                <th className="px-4 py-3 text-left font-bold">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {days.map((day) => {
                const dayTrainings = trainingsByDay[day]
                if (dayTrainings.length === 0) return null

                return dayTrainings.map((training, index) => {
                  const type = activityTypes[training.activity_type as keyof typeof activityTypes] || activityTypes.libre

                  return (
                    <tr key={training.id} className="hover:bg-gray-50 transition-colors">
                      {index === 0 && (
                        <td rowSpan={dayTrainings.length} className="px-4 py-3 font-bold text-primary border-r-2 border-gray-200 bg-gray-50">
                          {day}
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {training.start_time.slice(0, 5)} - {training.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-lg border-2 ${type.color}`}>
                          <span className="text-xl mr-2">{type.emoji}</span>
                          <span className="font-semibold">{training.activity_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {training.level && (
                          <span className="block text-sm font-semibold text-gray-800">{training.level}</span>
                        )}
                        {training.age_range && (
                          <span className="block text-sm text-gray-600">{training.age_range}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {training.description}
                      </td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cartes d'informations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lieu */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-4">
            <i className="fas fa-map-marker-alt mr-2"></i>
            Lieu
          </h3>
          <div className="space-y-3 text-gray-700">
            <p className="font-semibold">Gymnase Léo Lagrange</p>
            <p className="text-sm">Avenue Maréchal Juin<br />83000 Toulon</p>
            <p className="text-sm">
              <i className="fas fa-phone mr-2 text-primary"></i>
              06 12 34 56 78
            </p>
            <a
              href="https://maps.google.com/?q=Gymnase+Léo+Lagrange+Toulon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-secondary hover:underline text-sm font-semibold"
            >
              <i className="fas fa-external-link-alt"></i>
              Voir sur Google Maps
            </a>
          </div>
        </div>

        {/* Tarifs */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-4">
            <i className="fas fa-euro-sign mr-2"></i>
            Tarifs
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Jeunes (-18 ans)</span>
              <span className="text-secondary font-bold">120€</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Adultes</span>
              <span className="text-secondary font-bold">180€</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Loisir</span>
              <span className="text-secondary font-bold">150€</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-semibold">Réduction famille</span>
              <span className="text-green-600 font-bold">-20%</span>
            </div>
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-4">
            <i className="fas fa-info-circle mr-2"></i>
            Infos Pratiques
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <i className="fas fa-check text-green-600 mt-1"></i>
              <span className="text-sm">Essai gratuit première séance</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-check text-green-600 mt-1"></i>
              <span className="text-sm">Certificat médical obligatoire</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-check text-green-600 mt-1"></i>
              <span className="text-sm">Chaussures propres requises</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-check text-green-600 mt-1"></i>
              <span className="text-sm">Matériel fourni pour débutants</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-check text-green-600 mt-1"></i>
              <span className="text-sm">Vestiaires et douches disponibles</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
