import type { Metadata } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/components/auth/AuthProvider'
import CookieBanner from '@/components/ui/CookieBanner'
import BackToTop from '@/components/ui/BackToTop'
import JsonLd from '@/components/seo/JsonLd'
import { organizationJsonLd } from '@/lib/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TLSTT - Toulon La Seyne Tennis de Table | Club de Ping-Pong Var 83',
    template: '%s | TLSTT - Toulon La Seyne Tennis de Table',
  },
  description: 'Club de tennis de table à Toulon et La Seyne-sur-Mer (Var 83). Cours pour débutants et confirmés, compétitions FFTT, handisport, école de ping. Rejoignez-nous !',
  keywords: ['tennis de table', 'ping pong', 'Toulon', 'La Seyne-sur-Mer', 'TLSTT', 'club sport', 'Var', 'FFTT', 'handisport', 'compétition', 'cours tennis de table', 'école de ping'],
  authors: [{ name: 'TLSTT - Toulon La Seyne Tennis de Table' }],
  creator: 'TLSTT',
  publisher: 'TLSTT',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'TLSTT - Toulon La Seyne Tennis de Table',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TLSTT - Club de Tennis de Table Toulon La Seyne-sur-Mer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
    creator: '@tlstt83',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
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
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="flex flex-col min-h-screen bg-[#0a0a0a]">
        <JsonLd data={organizationJsonLd()} />
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
