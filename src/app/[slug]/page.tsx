import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Récupérer la page
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!page) {
    notFound()
  }

  // Récupérer les blocs de la page
  const { data: blocks } = await supabase
    .from('page_blocks')
    .select('*')
    .eq('page_id', page.id)
    .eq('status', 'published')
    .order('position')

  return (
    <div className="min-h-screen">
      {blocks?.map((block) => {
        const data = block.block_data as any

        switch (block.block_type) {
          case 'hero':
            return (
              <div
                key={block.id}
                className="relative h-[40vh] bg-cover bg-center"
                style={{ backgroundImage: `url(${data.image})` }}
              >
                <div className="absolute inset-0 bg-primary/70"></div>
                <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                  <div className="container-custom">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title}</h1>
                    {data.subtitle && (
                      <p className="text-xl text-gray-200">{data.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            )

          case 'text':
            return (
              <div key={block.id} className="container-custom py-8">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-secondary"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />
              </div>
            )

          case 'image':
            return (
              <div key={block.id} className="container-custom py-8">
                <img
                  src={data.url}
                  alt={data.alt || ''}
                  className="w-full rounded-lg shadow-lg"
                />
                {data.caption && (
                  <p className="text-center text-gray-600 mt-2">{data.caption}</p>
                )}
              </div>
            )

          default:
            return null
        }
      })}

      {/* Lien retour */}
      <div className="container-custom py-8">
        <Link href="/" className="text-primary hover:underline">
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

// Générer les métadonnées
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('pages')
    .select('title, meta_description')
    .eq('slug', slug)
    .single()

  if (!page) {
    return { title: 'Page non trouvée' }
  }

  return {
    title: `${page.title} | TLSTT`,
    description: page.meta_description,
  }
}
