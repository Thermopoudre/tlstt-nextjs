import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function NewCarouselSlidePage() {
  const supabase = await createClient()

  // Vérifier l'authentification admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  // Récupérer la prochaine position
  const { data: slides } = await supabase
    .from('carousel_slides')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = slides && slides.length > 0 ? slides[0].position + 1 : 1

  async function createSlide(formData: FormData) {
    'use server'
    const supabase = await createClient()
    
    const slideData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      description: formData.get('subtitle') as string,
      image_url: formData.get('image_url') as string || null,
      button_text: formData.get('button_text') as string || null,
      button_link: formData.get('button_link') as string || null,
      position: parseInt(formData.get('position') as string) || 1,
      is_active: formData.get('is_active') === 'on'
    }

    const { error } = await supabase.from('carousel_slides').insert(slideData)
    
    if (!error) {
      revalidatePath('/admin/carousel')
      revalidatePath('/')
      redirect('/admin/carousel')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Nouveau Slide</h1>
            <p className="text-gray-600">Créez un nouveau slide pour le carrousel</p>
          </div>
          <Link href="/admin/carousel" className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
            <i className="fas fa-arrow-left mr-2"></i>Retour
          </Link>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form action={createSlide} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Bienvenue au TLSTT"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <p className="text-sm text-gray-500 mt-1">Les mots "Tennis" et "Table" seront en turquoise</p>
              </div>

              {/* Sous-titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sous-titre
                </label>
                <input
                  type="text"
                  name="subtitle"
                  placeholder="Ex: Club de Tennis de Table de Toulon La Seyne"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* URL Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL de l'image de fond
                </label>
                <input
                  type="url"
                  name="image_url"
                  placeholder="https://exemple.com/image.jpg"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <p className="text-sm text-gray-500 mt-1">Laissez vide pour utiliser une image par défaut</p>
              </div>

              {/* Texte du bouton */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Texte du bouton
                </label>
                <input
                  type="text"
                  name="button_text"
                  placeholder="Ex: Découvrir"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Lien du bouton */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lien du bouton
                </label>
                <input
                  type="text"
                  name="button_link"
                  placeholder="Ex: /club ou /contact"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="number"
                  name="position"
                  defaultValue={nextPosition}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Actif */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  defaultChecked
                  className="w-5 h-5 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="is_active" className="ml-3 text-sm font-semibold text-gray-700">
                  Activer ce slide
                </label>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Link
                href="/admin/carousel"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-semibold"
              >
                <i className="fas fa-save mr-2"></i>
                Créer le slide
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
