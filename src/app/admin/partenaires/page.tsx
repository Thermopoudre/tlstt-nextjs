import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPartenairesPage() {
  const supabase = await createClient()

  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .order('display_order')

  const categories = {
    principal: 'Principal',
    premium: 'Premium',
    standard: 'Standard',
    institutionnel: 'Institutionnel',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partenaires</h1>
          <p className="text-gray-600 mt-1">Gérez vos partenaires et sponsors</p>
        </div>
        <Link
          href="/admin/partenaires/nouveau"
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nouveau partenaire
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(categories).map(([key, label]) => (
          <div key={key} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900">
              {partners?.filter(p => p.category === key).length || 0}
            </div>
            <div className="text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site web</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {partners && partners.length > 0 ? (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                    {partner.description && (
                      <div className="text-xs text-gray-500 line-clamp-1">{partner.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {categories[partner.category as keyof typeof categories]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {partner.website_url ? (
                      <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        <i className="fas fa-external-link-alt mr-1"></i>
                        Voir
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      partner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {partner.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/partenaires/${partner.id}/edit`}
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
                <td colSpan={5} className="px-6 py-12 text-center">
                  <i className="fas fa-handshake text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">Aucun partenaire</p>
                  <Link href="/admin/partenaires/nouveau" className="text-primary hover:underline mt-2 inline-block">
                    Ajouter le premier partenaire
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
