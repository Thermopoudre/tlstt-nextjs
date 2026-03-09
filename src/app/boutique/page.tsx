import { Metadata } from 'next'
import BoutiqueClient from './BoutiqueClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Boutique TLSTT | Équipements et tenues du club',
  description: 'Commandez les équipements officiels du TLSTT (Toulon La Seyne Tennis de Table) : maillots, shorts, sacs et accessoires du club. Boutique réservée aux membres.',
  alternates: {
    canonical: `${SITE_URL}/boutique`,
  },
  openGraph: {
    title: 'Boutique TLSTT',
    description: 'Équipements et tenues officiels du TLSTT — maillots, shorts et accessoires du club de tennis de table.',
    url: `${SITE_URL}/boutique`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function BoutiquePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Boutique', url: '/boutique' },
      ])} />
      <BoutiqueClient />
    </>
  )
}
