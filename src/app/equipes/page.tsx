import { Metadata } from 'next'
import EquipesClient from './EquipesClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Équipes TLSTT | Championnats par équipes — Saison 2025/2026',
  description: 'Suivez les résultats et classements des équipes du TLSTT (Toulon La Seyne Tennis de Table) en championnats par équipes — Phase 1 et Phase 2, de la Nationale 3 à la Départementale 4.',
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
