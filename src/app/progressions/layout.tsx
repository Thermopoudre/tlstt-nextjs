import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Progressions - Classement et Évolution des Joueurs',
  description: 'Suivez la progression des joueurs du TLSTT Toulon La Seyne Tennis de Table. Évolution des points FFTT, classements et statistiques de progression.',
  alternates: { canonical: '/progressions' },
  openGraph: {
    title: 'Progressions des Joueurs TLSTT',
    description: 'Classement et évolution des points des joueurs du TLSTT.',
    url: '/progressions',
  },
  keywords: ['progression', 'classement', 'joueurs', 'TLSTT', 'points FFTT', 'tennis de table', 'évolution'],
}

export default function ProgressionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
