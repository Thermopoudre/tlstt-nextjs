import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boutique du Club - Articles Officiels TLSTT',
  description: 'Boutique en ligne du TLSTT : maillots, accessoires et équipements officiels du club de tennis de table Toulon La Seyne. Réservé aux membres licenciés.',
  alternates: { canonical: '/boutique' },
  openGraph: {
    title: 'Boutique TLSTT - Articles du Club',
    description: 'Achetez les articles officiels du club de tennis de table TLSTT.',
    url: '/boutique',
  },
  keywords: ['boutique', 'TLSTT', 'maillot', 'tennis de table', 'équipement', 'accessoires'],
}

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
