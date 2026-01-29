import type { Metadata } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/components/auth/AuthProvider'
import CookieBanner from '@/components/ui/CookieBanner'
import BackToTop from '@/components/ui/BackToTop'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '600', '700', '800'],
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'Toulon La Seyne Tennis de Table',
    template: '%s - TLSTT',
  },
  description: 'Club de tennis de table à Toulon La Seyne - Cours, compétitions et loisirs pour tous niveaux',
  keywords: ['tennis de table', 'ping pong', 'Toulon', 'La Seyne', 'TLSTT', 'sport', 'club'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'TLSTT',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${openSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <meta name="theme-color" content="#0f3057" />
      </head>
      <body className="flex flex-col min-h-screen bg-[#f4f6f9]">
        <AuthProvider>
          <Header />
          <main className="flex-1 py-0">
            {children}
          </main>
          <Footer />
          <BackToTop />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  )
}
