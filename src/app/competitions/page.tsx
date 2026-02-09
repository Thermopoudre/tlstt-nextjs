import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CompetitionsContent from './CompetitionsContent'

export const metadata: Metadata = {
  title: 'Compétitions - Résultats et Calendrier',
  description: 'Calendrier et résultats des compétitions de tennis de table du TLSTT. Tournois, championnats FFTT et rencontres à venir à Toulon La Seyne-sur-Mer.',
  alternates: { canonical: '/competitions' },
  openGraph: {
    title: 'Compétitions TLSTT',
    description: 'Résultats et calendrier des compétitions du club de tennis de table TLSTT.',
    url: '/competitions',
  },
  keywords: ['compétitions', 'résultats', 'tournoi', 'tennis de table', 'TLSTT', 'championnat', 'FFTT'],
}

export default async function CompetitionsPage() {
  const supabase = await createClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .order('date', { ascending: false })

  return <CompetitionsContent competitions={competitions || []} />
}
