import { Metadata } from 'next'
import EquipesClient from './EquipesClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

// Les données viennent de l'API /api/equipes (côté client), mais on déclare
// revalidate pour que le shell HTML soit recréé régulièrement (SEO + breadcrumb frais)
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Équipes TLSTT | Championnats par équipes — Saison 2025/2026',
  description: 'Suivez les résultats et classements des équipes du TLSTT (Toulon La Seyne Tennis de Table) en championnats par équipes — Phase 1 et Phase 2, de la Nationale 3 à la Départementale 4.',
  keywords: ['équipes', 'championnat', 'classement', 'TLSTT', 'tennis de table', 'FFTT', 'Nationale', 'Régionale', 'Départementale', 'Toulon', 'La Seyne'],
  alternates: {
    canonical: `${SITE_URL}/equipes`,
  },
  openGraph: {
    title: 'Équipes TLSTT',
    description: 'Classements et résultats des équipes du TLSTT — Nationale, Régionale, Départementale.',
    url: `${SITE_URL}/equipes`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Équipes TLSTT - Championnats 2025/2026' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Équipes TLSTT | Championnats 2025/2026',
    description: 'Classements et résultats des équipes du TLSTT — Nationale, Régionale, Départementale.',
    images: [`${SITE_URL}/og-image.png`],
  },
}

export default function EquipesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Équipes', url: '/equipes' },
      ])} />
      <EquipesClient />
    </>
  )
}
