import { Metadata } from 'next'
import ClubsPacaClient from './ClubsPacaClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Clubs de Tennis de Table PACA | Annuaire des clubs de la région',
  description: 'Retrouvez tous les clubs de tennis de table de la région Provence-Alpes-Côte d\'Azur (PACA) : coordonnées, adresses, contacts et informations pratiques.',
  keywords: ['clubs PACA', 'tennis de table', 'Provence', 'Var', 'Bouches-du-Rhône', 'Alpes-Maritimes', 'annuaire', 'FFTT'],
  alternates: {
    canonical: `${SITE_URL}/clubs-paca`,
  },
  openGraph: {
    title: 'Clubs de Tennis de Table PACA',
    description: 'Annuaire complet des clubs de tennis de table de la région PACA — Var, Bouches-du-Rhône, Alpes-Maritimes et plus.',
    url: `${SITE_URL}/clubs-paca`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function ClubsPacaPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Clubs PACA', url: '/clubs-paca' },
      ])} />
      <ClubsPacaClient />
    </>
  )
}
