import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { Metadata } from 'next'
import { getPlanningSettings, getGlobalSettings } from '@/lib/settings'

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
  jeunes: { emoji: '🎓', bgClass: 'bg-green-500/20 border-green-500/50' },
  dirige: { emoji: '🎯', bgClass: 'bg-[#3b9fd8]/20 border-[#3b9fd8]/50' },
  libre: { emoji: '🏓', bgClass: 'bg-gray-500/20 border-gray-500/50' },
  loisirs: { emoji: '😊', bgClass: 'bg-yellow-500/20 border-yellow-500/50' },
  individuel: { emoji: '⭐', bgClass: 'bg-purple-500/20 border-purple-500/50' },
  competition: { emoji: '🏆', bgClass: 'bg-red-500/20 border-red-500/50' },
  handisport: { emoji: '♿', bgClass: 'bg-pink-500/20 border-pink-500/50' },
}

export default async function PlanningPage() {
  const supabase = await createClient()
  const planningSettings = await getPlanningSettings()
  const globalSettings = await getGlobalSettings()

  const { data: trainings } = await supabase
    .from('trainings')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  // Grouper par jour
  const trainingsByDay = (trainings || []).reduce((acc: Record<number, Training[]>, training: Training) => {
    const day = training.day_of_week
    if (!acc[day]) acc[day] = []
    acc[day].push(training)
    return acc
  }, {} as Record<number, Training[]>)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-calendar-alt text-4xl text-[#3b9fd8]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">Planning des Entraînements</h1>
              <p className="text-gray-400">Retrouvez tous nos créneaux hebdomadaires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Légende */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-[#3b9fd8]"></i>
            Légende
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(activityConfig).map(([key, config]) => (
              <span key={key} className={`px-3 py-1 rounded-full border text-white text-sm ${config.bgClass}`}>
                {config.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Planning */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-[#111]">
                <th className="px-4 py-4 text-left font-semibold text-[#3b9fd8]">Jour</th>
                <th className="px-4 py-4 text-left font-semibold text-[#3b9fd8]">Horaires</th>
                <th className="px-4 py-4 text-left font-semibold text-[#3b9fd8]">Activité</th>
                <th className="px-4 py-4 text-left font-semibold text-[#3b9fd8] hidden md:table-cell">Niveau / Public</th>
                <th className="px-4 py-4 text-left font-semibold text-[#3b9fd8] hidden lg:table-cell">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {[1, 2, 3, 4, 5, 6].map(dayIndex => {
                const dayTrainings = trainingsByDay[dayIndex] || []
                if (dayTrainings.length === 0) return null

                return dayTrainings.map((training: Training, idx: number) => {
                  const config = activityConfig[training.activity_type] || activityConfig.libre
                  return (
                    <tr key={training.id} className="hover:bg-[#222]">
                      {idx === 0 && (
                        <td className="px-4 py-3 font-bold text-white" rowSpan={dayTrainings.length}>
                          {dayNames[dayIndex]}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-300">
                        {training.start_time.slice(0, 5)} - {training.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgClass}`}>
                          <span>{config.emoji}</span>
                          <span className="font-medium text-white">{training.activity_name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {training.level && <span className="text-gray-300">{training.level}</span>}
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
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#3b9fd8]"></i>
              Lieu
            </h3>
            <p className="text-gray-300 mb-1">{planningSettings.location || globalSettings.address}</p>
            <p className="text-gray-500 text-sm">{globalSettings.postal_code} {globalSettings.city}</p>
            {globalSettings.maps_url && (
              <a
                href={globalSettings.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b9fd8] text-sm hover:underline mt-2 inline-block"
              >
                <i className="fas fa-external-link-alt mr-1"></i>
                Voir sur Google Maps
              </a>
            )}
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-euro-sign text-[#3b9fd8]"></i>
              Tarifs
            </h3>
            <div className="space-y-2 text-sm">
              {planningSettings.tarifs?.map((tarif, i) => (
                <div key={i} className={`flex justify-between ${tarif.price.startsWith('-') ? 'text-green-400' : ''}`}>
                  <span className={tarif.price.startsWith('-') ? '' : 'text-gray-400'}>{tarif.label}</span>
                  <span className="font-bold">{tarif.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-lightbulb text-[#3b9fd8]"></i>
              Infos Pratiques
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {planningSettings.infos_pratiques?.map((info, i) => (
                <li key={i} className="flex items-center gap-2">
                  <i className="fas fa-check text-green-500"></i>
                  {info}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-block bg-[#3b9fd8] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#2d8bc9] transition-colors"
          >
            <i className="fas fa-user-plus mr-2"></i>
            S'inscrire au club
          </Link>
        </div>
      </div>
    </div>
  )
}
