import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { generatePageMeta } from '@/lib/seo'

type Props = { params: Promise<{ id: string }>; children: React.ReactNode }

/**
 * La page d'annonce est un composant client (elle dépend de la session du
 * membre) : les métadonnées de partage sont donc portées par ce layout serveur.
 * Sans cela, une annonce partagée sur WhatsApp ou Facebook affichait le titre
 * générique du site au lieu du titre, du prix et de la photo de l'annonce.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: annonce } = await supabase
    .from('marketplace_listings')
    .select('title, description, price, images, is_gift, is_exchange, status')
    .eq('id', id)
    .single()

  if (!annonce || annonce.status !== 'active') {
    return { title: 'Annonce — Marketplace TLSTT', robots: { index: false } }
  }

  const prix = annonce.is_gift
    ? 'Don'
    : annonce.is_exchange
      ? 'Échange'
      : annonce.price != null
        ? `${Number(annonce.price).toFixed(0)} €`
        : ''
  const image = Array.isArray(annonce.images) && annonce.images.length > 0 ? annonce.images[0] : undefined

  return generatePageMeta({
    title: `${annonce.title}${prix ? ` — ${prix}` : ''} | Marketplace TLSTT`,
    description: (annonce.description || '').slice(0, 160) || 'Annonce entre membres du TLSTT.',
    path: `/marketplace/${id}`,
    image,
    keywords: ['marketplace', 'tennis de table', 'occasion', annonce.title],
  })
}

export default function MarketplaceAnnonceLayout({ children }: Props) {
  return <>{children}</>
}
