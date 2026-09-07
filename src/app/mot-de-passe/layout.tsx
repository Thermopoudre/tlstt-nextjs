import type { Metadata } from 'next'

// Page utilitaire : aucune raison d'apparaître dans les résultats de recherche.
export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
}

export default function MotDePasseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
