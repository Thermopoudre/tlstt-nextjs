import { Metadata } from 'next'
import NewsletterClient from './NewsletterClient'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Newsletter TLSTT | Restez informé des actualités du club',
  description: 'Inscrivez-vous à la newsletter du TLSTT (Toulon La Seyne Tennis de Table) et recevez les actualités, résultats des compétitions et événements du club.',
  alternates: {
    canonical: `${SITE_URL}/newsletter`,
  },
  openGraph: {
    title: 'Newsletter TLSTT',
    description: 'Inscrivez-vous à la newsletter du TLSTT et restez informé des actualités, résultats et événements du club de tennis de table.',
    url: `${SITE_URL}/newsletter`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function NewsletterPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Newsletter', url: '/newsletter' },
      ])} />
      <NewsletterClient />
    </>
  )
}
