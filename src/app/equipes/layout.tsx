import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nos Équipes - Championnats par Équipes FFTT',
  description: 'Découvrez les équipes du TLSTT Toulon La Seyne Tennis de Table engagées en championnats FFTT. Classements, résultats et statistiques de la saison en cours.',
  alternates: { canonical: '/equipes' },
  openGraph: {
    title: 'Équipes TLSTT - Championnats FFTT',
    description: 'Classements et résultats des équipes du club de tennis de table TLSTT en championnats par équipes.',
    url: '/equipes',
  },
  keywords: ['équipes', 'TLSTT', 'championnat', 'FFTT', 'tennis de table', 'classement', 'Toulon', 'La Seyne'],
}

export default function EquipesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
