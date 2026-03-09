import { Metadata } from 'next'
import MarketplaceClient from './MarketplaceClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Marketplace TLSTT | Achetez et vendez entre membres',
  description: 'La marketplace du TLSTT (Toulon La Seyne Tennis de Table) : achetez, vendez ou échangez du matériel de tennis de table entre membres du club.',
  alternates: {
    canonical: `${SITE_URL}/marketplace`,
  },
  openGraph: {
    title: 'Marketplace TLSTT',
    description: 'Achetez, vendez et échangez du matériel de tennis de table entre membres du TLSTT.',
    url: `${SITE_URL}/marketplace`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function MarketplacePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Marketplace', url: '/marketplace' },
      ])} />
      <MarketplaceClient />
    </>
  )
}
