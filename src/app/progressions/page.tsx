import { Metadata } from 'next'
import ProgressionsClient from './ProgressionsClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Progressions des joueurs TLSTT | Classements et évolutions',
  description: 'Suivez les progressions et classements des joueurs du TLSTT (Toulon La Seyne Tennis de Table) : top progresseurs du mois, de la saison et tableau complet des évolutions de points.',
  keywords: ['progressions', 'classements', 'joueurs', 'TLSTT', 'tennis de table', 'Toulon', 'FFTT', 'points'],
  alternates: {
    canonical: `${SITE_URL}/progressions`,
  },
  openGraph: {
    title: 'Progressions des joueurs TLSTT',
    description: 'Classements et évolutions des joueurs du TLSTT — top progresseurs du mois et de la saison.',
    url: `${SITE_URL}/progressions`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function ProgressionsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Progressions', url: '/progressions' },
      ])} />
      <ProgressionsClient />
    </>
  )
}
