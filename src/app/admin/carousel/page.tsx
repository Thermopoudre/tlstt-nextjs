import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function AdminCarouselPage() {
  const supabase = await createClient()

  // Vérifier l'authentification admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  // Récupérer les slides
  const { data: slides } = await supabase
    .from('carousel_slides')
    .select('*')
    .order('position')

  async function deleteSlide(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    await supabase.from('carousel_slides').delete().eq('id', id)
    revalidatePath('/admin/carousel')
  }

  async function toggleActive(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    const currentStatus = formData.get('is_active') === 'true'
    await supabase.from('carousel_slides').update({ is_active: !currentStatus }).eq('id', id)
    revalidatePath('/admin/carousel')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestion du Carrousel</h1>
            <p className="text-gray-600">Gérez les slides de la page d'accueil</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
              <i className="fas fa-arrow-left mr-2"></i>Retour
            </Link>
            <Link href="/admin/carousel/new" className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600">
              <i className="fas fa-plus mr-2"></i>Nouveau slide
            </Link>
          </div>
        </div>

        {/* Liste des slides */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Position</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Titre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Sous-titre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Bouton</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {slides && slides.length > 0 ? (
                slides.map((slide: any) => (
                  <tr key={slide.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {slide.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {slide.image_url ? (
                        <img src={slide.image_url} alt={slide.title} className="w-24 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <i className="fas fa-image text-gray-400"></i>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{slide.title}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{slide.subtitle || slide.description}</td>
                    <td className="px-6 py-4">
                      {slide.button_text ? (
                        <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-sm">
                          {slide.button_text}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <form action={toggleActive}>
                        <input type="hidden" name="id" value={slide.id} />
                        <input type="hidden" name="is_active" value={slide.is_active?.toString()} />
                        <button type="submit" className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          slide.is_active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                          {slide.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/carousel/${slide.id}/edit`}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <form action={deleteSlide}>
                          <input type="hidden" name="id" value={slide.id} />
                          <button
                            type="submit"
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            onClick={(e) => {
                              if (!confirm('Supprimer ce slide ?')) {
                                e.preventDefault()
                              }
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <i className="fas fa-images text-4xl mb-3 block"></i>
                    <p>Aucun slide configuré</p>
                    <Link href="/admin/carousel/new" className="text-cyan-600 hover:underline mt-2 inline-block">
                      Créer le premier slide
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="mt-8 bg-cyan-50 border border-cyan-200 rounded-xl p-6">
          <h3 className="font-bold text-cyan-800 mb-2">
            <i className="fas fa-info-circle mr-2"></i>
            Comment ça fonctionne ?
          </h3>
          <ul className="text-cyan-700 text-sm space-y-1">
            <li>• Les slides sont affichés dans l'ordre de leur position</li>
            <li>• Seuls les slides "Actifs" sont visibles sur le site</li>
            <li>• Vous pouvez personnaliser le titre, sous-titre, image et bouton de chaque slide</li>
            <li>• Les mots "Tennis" et "Table" sont automatiquement colorés en turquoise</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
