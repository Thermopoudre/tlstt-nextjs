import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'
const SITE_NAME = 'TLSTT - Toulon La Seyne Tennis de Table'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

/**
 * Generate page metadata with SEO best practices
 */
export function generatePageMeta({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  keywords,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  keywords?: string[]
  noIndex?: boolean
}): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image || DEFAULT_OG_IMAGE

  return {
    title,
    description,
    keywords: keywords || ['tennis de table', 'ping pong', 'TLSTT', 'Toulon', 'La Seyne-sur-Mer'],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'fr_FR',
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}

/**
 * Strip HTML tags from a string for meta descriptions
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Auto-generate meta description from content
 * Truncates at 155 characters (Google's recommended limit)
 */
export function autoDescription(content: string, maxLength = 155): string {
  const clean = stripHtml(content)
  if (clean.length <= maxLength) return clean
  return clean.substring(0, maxLength - 3).replace(/\s+\S*$/, '') + '...'
}

/**
 * Auto-extract keywords from text
 */
export function autoKeywords(title: string, content: string): string[] {
  const baseKeywords = ['tennis de table', 'TLSTT', 'Toulon', 'La Seyne-sur-Mer', 'ping pong']
  
  // Extract capitalized words and common terms from title
  const titleWords = title
    .split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.toLowerCase())
    .filter(w => !['avec', 'dans', 'pour', 'plus', 'cette', 'notre', 'tous', 'tout'].includes(w))

  return [...new Set([...baseKeywords, ...titleWords])].slice(0, 10)
}

// === JSON-LD Structured Data ===

/**
 * Organization schema for the club (used on homepage/about)
 */
export function organizationJsonLd(settings?: {
  name?: string
  description?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  foundingDate?: number
  logo?: string
  facebook?: string
  instagram?: string
}) {
  const s = settings || {}
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: s.name || 'TLSTT - Toulon La Seyne Tennis de Table',
    description: s.description || 'Club de tennis de table à Toulon et La Seyne-sur-Mer',
    url: SITE_URL,
    logo: s.logo || `${SITE_URL}/logo.jpeg`,
    image: DEFAULT_OG_IMAGE,
    email: s.email || 'contact@tlstt.fr',
    telephone: s.phone || undefined,
    sport: 'Tennis de table',
    foundingDate: s.foundingDate ? `${s.foundingDate}` : '1954',
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address || 'Gymnase Léo Lagrange, Avenue Maréchal Juin',
      addressLocality: s.city || 'La Seyne-sur-Mer',
      postalCode: s.postalCode || '83500',
      addressCountry: 'FR',
    },
    sameAs: [
      s.facebook,
      s.instagram,
    ].filter(Boolean),
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'Fédération Française de Tennis de Table',
      url: 'https://www.fftt.com',
    },
  }
}

/**
 * Article schema for news
 */
export function articleJsonLd({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  author,
  category,
}: {
  title: string
  description: string
  url: string
  image?: string
  publishedTime: string
  modifiedTime?: string
  author?: string
  category?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || DEFAULT_OG_IMAGE,
    url: `${SITE_URL}${url}`,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Organization',
      name: 'TLSTT',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TLSTT',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.jpeg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${url}`,
    },
    ...(category && {
      articleSection: category === 'club' ? 'Club' : category === 'tt' ? 'Tennis de Table' : 'Handisport',
    }),
  }
}

/**
 * Event schema for competitions
 */
export function eventJsonLd({
  name,
  description,
  startDate,
  location,
  organizer,
}: {
  name: string
  description?: string
  startDate: string
  location?: string
  organizer?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    description: description || `Match de tennis de table : ${name}`,
    startDate,
    sport: 'Tennis de table',
    location: {
      '@type': 'Place',
      name: location || 'Gymnase Léo Lagrange',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'La Seyne-sur-Mer',
        postalCode: '83500',
        addressCountry: 'FR',
      },
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: organizer || 'TLSTT',
      url: SITE_URL,
    },
  }
}

/**
 * BreadcrumbList schema
 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

/**
 * FAQPage schema
 */
export function faqJsonLd(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }
}
