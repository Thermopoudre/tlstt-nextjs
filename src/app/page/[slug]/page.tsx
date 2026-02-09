import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: page } = await supabase.from('pages').select('title, meta_description').eq('slug', slug).single()

  if (!page) return { title: 'Page introuvable' }
  return {
    title: page.title,
    description: page.meta_description || undefined,
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase.from('pages').select('*').eq('slug', slug).single()
  if (!page) notFound()

  const { data: blocks } = await supabase
    .from('page_blocks')
    .select('*')
    .eq('page_id', page.id)
    .eq('status', 'published')
    .order('position')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <Breadcrumbs className="text-gray-500 mb-8" />
        {(blocks || []).map((block: any) => (
          <div key={block.id} className="mb-8">
            {renderBlock(block)}
          </div>
        ))}
        {(!blocks || blocks.length === 0) && (
          <div className="text-center py-20 text-gray-500">
            <i className="fas fa-file-alt text-4xl mb-3 block opacity-30"></i>
            <p>Cette page est en cours de construction.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function renderBlock(block: any) {
  const data = block.block_data

  switch (block.block_type) {
    case 'hero':
      return (
        <div
          className="relative rounded-2xl overflow-hidden py-20 px-8 text-center"
          style={{ backgroundImage: data.backgroundUrl ? `url(${data.backgroundUrl})` : undefined, backgroundColor: '#111' }}
        >
          {data.backgroundUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{data.title}</h1>
            {data.subtitle && <p className="text-xl text-gray-300 mb-8">{data.subtitle}</p>}
            {data.buttonText && data.buttonLink && (
              <Link href={data.buttonLink} className="bg-[#3b9fd8] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#2d8bc9] transition-colors inline-block">
                {data.buttonText}
              </Link>
            )}
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
      )

    case 'image':
      return (
        <figure className="rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.url} alt={data.alt || ''} className="w-full rounded-2xl" />
          {data.caption && <figcaption className="text-center text-gray-500 text-sm mt-3">{data.caption}</figcaption>}
        </figure>
      )

    case 'cta':
      const styles: Record<string, string> = {
        primary: 'bg-[#3b9fd8] text-white hover:bg-[#2d8bc9]',
        secondary: 'border-2 border-[#3b9fd8] text-[#3b9fd8] hover:bg-[#3b9fd8] hover:text-white',
        accent: 'bg-[#4c40cf] text-white hover:bg-[#3d32b0]',
      }
      return (
        <div className="text-center">
          <Link href={data.link || '#'} className={`inline-block px-8 py-3 rounded-lg font-bold transition-colors ${styles[data.style] || styles.primary}`}>
            {data.text || 'En savoir plus'}
          </Link>
        </div>
      )

    case 'stats':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(data.items || []).map((item: any, i: number) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-[#3b9fd8] mb-1">{item.value}</div>
              <div className="text-gray-400 text-sm">{item.label}</div>
            </div>
          ))}
        </div>
      )

    case 'cards':
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(data.items || []).map((item: any, i: number) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-6 hover:border-[#3b9fd8]/50 transition-colors">
              {item.icon && <i className={`fas ${item.icon} text-2xl text-[#3b9fd8] mb-3`}></i>}
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}
