'use client'

import { usePathname } from 'next/navigation'
import BackToTop from '@/components/ui/BackToTop'
import CookieBanner from '@/components/ui/CookieBanner'

/**
 * Habillage public (bandeau d'alerte, en-tête, pied de page…).
 *
 * Masqué dans le back-office : sinon deux barres de navigation se superposent
 * et le menu public recouvre le haut du menu latéral d'administration.
 *
 * L'en-tête, le pied de page et le bandeau d'alerte sont rendus côté serveur
 * puis transmis en props (ce composant est un composant client).
 */
export default function PublicChrome({
  children,
  alertBanner,
  header,
  footer,
}: {
  children: React.ReactNode
  alertBanner?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  if (isAdmin) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <>
      {alertBanner}
      {header}
      <main className="flex-1 py-0">{children}</main>
      {footer}
      <BackToTop />
      <CookieBanner />
    </>
  )
}
