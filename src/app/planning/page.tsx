import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planning - Horaires des Entraînements',
  description: 'Consultez le planning hebdomadaire des entraînements du club TLSTT. École de ping, entraînement dirigé, jeu libre.',
  openGraph: {
    title: 'Planning TLSTT',
    description: 'Horaires des entraînements de tennis de table',
  },
}

interface Training {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  activity_name: string
  activity_type: string
  level: string | null
  age_range: string | null
  description: string | null
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const activityConfig: Record<string, { emoji: string; bgClass: string }> = {
  jeunes: { emoji: '🎓', bgClass: 'bg-green-500/20 border-green-500/40' },
  dirige: { emoji: '🎯', bgClass: 'bg-blue-500/20 border-blue-500/40' },
  libre: { emoji: '🏓', bgClass: 'bg-gray-500/20 border-gray-500/40' },
  loisirs: { emoji: '😊', bgClass: 'bg-yellow-500/20 border-yellow-500/40' },
  individuel: { emoji: '⭐', bgClass: 'bg-purple-500/20 border-purple-500/40' },
  competition: { emoji: '🏆', bgClass: 'bg-red-500/20 border-red-500/40' },
  handisport: { emoji: '♿', bgClass: 'bg-pink-500/20 border-pink-500/40' },
}

export default async function PlanningPage() {
  const supabase = await createClient()

  const { data: trainings } = await supabase
    .from('trainings')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  // Grouper par jour
  const trainingsByDay = (trainings || []).reduce((acc, training) => {
    const day = training.day_of_week
    if (!acc[day]) acc[day] = []
    acc[day].push(training)
    return acc
  }, {} as Record<number, Training[]>)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0f3057] py-12">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-400 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-calendar-alt text-4xl text-[#5bc0de]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">Planning des Entraînements</h1>
              <p className="text-gray-300">Retrouvez tous nos créneaux hebdomadaires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Légende */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-[#5bc0de]"></i>
            Légende
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(activityConfig).map(([key, config]) => (
              <span key={key} className={`px-3 py-1 rounded-full border ${config.bgClass} text-sm`}>
                {config.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Planning */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0f3057] text-white">
                <th className="px-4 py-4 text-left font-semibold">Jour</th>
                <th className="px-4 py-4 text-left font-semibold">Horaires</th>
                <th className="px-4 py-4 text-left font-semibold">Activité</th>
                <th className="px-4 py-4 text-left font-semibold hidden md:table-cell">Niveau / Public</th>
                <th className="px-4 py-4 text-left font-semibold hidden lg:table-cell">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3, 4, 5, 6].map(dayIndex => {
                const dayTrainings = trainingsByDay[dayIndex] || []
                if (dayTrainings.length === 0) return null

                return dayTrainings.map((training, idx) => {
                  const config = activityConfig[training.activity_type] || activityConfig.libre
                  return (
                    <tr key={training.id} className="hover:bg-gray-50">
                      {idx === 0 && (
                        <td className="px-4 py-3 font-bold text-[#0f3057]" rowSpan={dayTrainings.length}>
                          {dayNames[dayIndex]}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-700">
                        {training.start_time.slice(0, 5)} - {training.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgClass}`}>
                          <span>{config.emoji}</span>
                          <span className="font-medium">{training.activity_name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {training.level && <span className="text-gray-700">{training.level}</span>}
                        {training.age_range && <span className="text-gray-500 text-sm ml-2">{training.age_range}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm hidden lg:table-cell">
                        {training.description || '-'}
                      </td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>

        {/* Infos */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#5bc0de]"></i>
              Lieu
            </h3>
            <p className="text-gray-600 mb-1">Gymnase Léo Lagrange</p>
            <p className="text-gray-500 text-sm">Avenue Maréchal Juin, 83500 La Seyne-sur-Mer</p>
            <a
              href="https://maps.google.com/?q=Gymnase+Léo+Lagrange+La+Seyne"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5bc0de] text-sm hover:underline mt-2 inline-block"
            >
              <i className="fas fa-external-link-alt mr-1"></i>
              Voir sur Google Maps
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
              <i className="fas fa-euro-sign text-[#5bc0de]"></i>
              Tarifs
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Jeunes (-18 ans)</span>
                <span className="font-bold">120€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Adultes</span>
                <span className="font-bold">180€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loisir</span>
                <span className="font-bold">150€</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Réduction famille</span>
                <span className="font-bold">-20%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
              <i className="fas fa-lightbulb text-[#5bc0de]"></i>
              Infos Pratiques
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Essai gratuit
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-file-medical text-blue-500"></i>
                Certificat médical requis
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-shoe-prints text-gray-500"></i>
                Chaussures propres
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-table-tennis-paddle-ball text-[#5bc0de]"></i>
                Matériel fourni débutants
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-block bg-[#5bc0de] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#4ab0ce] transition-colors shadow-lg"
          >
            <i className="fas fa-user-plus mr-2"></i>
            S'inscrire au club
          </Link>
        </div>
      </div>
    </div>
  )
}
