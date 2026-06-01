import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CompetitionsContent from './CompetitionsContent'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, eventJsonLd } from '@/lib/seo'

// Revalider toutes les heures (cron sync-equipes sam+dim soir)
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export const metadata: Metadata = {
  title: 'Compétitions - Résultats et Calendrier',
  description: 'Calendrier et résultats des compétitions de tennis de table du TLSTT. Tournois, championnats FFTT et rencontres à venir à Toulon La Seyne-sur-Mer.',
  keywords: ['compétitions', 'résultats', 'tournoi', 'tennis de table', 'TLSTT', 'championnat', 'FFTT', 'calendrier', 'Toulon', 'La Seyne'],
  alternates: { canonical: `${SITE_URL}/competitions` },
  openGraph: {
    title: 'Compétitions TLSTT',
    description: 'Résultats et calendrier des compétitions du club de tennis de table TLSTT.',
    url: `${SITE_URL}/competitions`,
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Compétitions TLSTT - Calendrier et Résultats' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compétitions TLSTT',
    description: 'Résultats et calendrier des compétitions du club de tennis de table TLSTT.',
    images: [`${SITE_URL}/og-image.png`],
  },
}

export default async function CompetitionsPage() {
  const supabase = await createClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .order('date', { ascending: false })

  const upcoming = (competitions || []).filter((c: { status?: string }) => c.status === 'upcoming').slice(0, 20)
  const eventsLd = upcoming.map((c: { team_name?: string; opponent?: string; type?: string; date: string; location?: string }) =>
    eventJsonLd({
      name: `${c.team_name || 'TLSTT'} ${c.type === 'domicile' ? 'reçoit' : 'se déplace à'} ${c.opponent || ''}`.trim(),
      startDate: c.date,
      location: c.location || undefined,
    })
  )

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: 'Accueil', url: '/' },
          { name: 'Compétitions', url: '/competitions' },
        ]),
        ...eventsLd,
      ]} />
      <CompetitionsContent competitions={competitions || []} />
    </>
  )
}
