import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPlanningPage() {
  const supabase = await createClient()

  const { data: trainings } = await supabase
    .from('trainings')
    .select('*')
    .order('day_of_week')
    .order('start_time')

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning d'entraînement</h1>
          <p className="text-gray-600 mt-1">Gérez les créneaux d'entraînement</p>
        </div>
        <Link
          href="/admin/planning/nouveau"
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nouveau créneau
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-gray-900">{trainings?.length || 0}</div>
          <div className="text-gray-600">Créneaux</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-3xl font-bold text-gray-900">
            {trainings?.filter(t => t.is_active).length || 0}
          </div>
          <div className="text-gray-600">Actifs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-3xl font-bold text-gray-900">
            {trainings?.filter(t => t.activity_type === 'jeunes').length || 0}
          </div>
          <div className="text-gray-600">Jeunes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-cyan-500">
          <div className="text-3xl font-bold text-gray-900">
            {trainings?.filter(t => t.activity_type === 'dirige').length || 0}
          </div>
          <div className="text-gray-600">Dirigés</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jour</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horaires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trainings && trainings.length > 0 ? (
              trainings.map((training) => (
                <tr key={training.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {days[training.day_of_week - 1]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {training.start_time.slice(0, 5)} - {training.end_time.slice(0, 5)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{training.activity_name}</div>
                    {training.description && (
                      <div className="text-xs text-gray-500 line-clamp-1">{training.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      training.activity_type === 'jeunes' ? 'bg-green-100 text-green-800' :
                      training.activity_type === 'dirige' ? 'bg-blue-100 text-blue-800' :
                      training.activity_type === 'libre' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {training.activity_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {training.level || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      training.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {training.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/planning/${training.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button className="text-red-600 hover:text-red-900">
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <i className="fas fa-calendar-alt text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">Aucun créneau pour le moment</p>
                  <Link href="/admin/planning/nouveau" className="text-primary hover:underline mt-2 inline-block">
                    Créer le premier créneau
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
