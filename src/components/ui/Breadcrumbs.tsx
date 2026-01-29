'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Mapping des chemins vers des labels lisibles
const pathLabels: Record<string, string> = {
  'actualites': 'Actualités',
  'club': 'Club',
  'tt': 'Tennis de Table',
  'handi': 'Handisport',
  'joueurs': 'Joueurs',
  'equipes': 'Équipes',
  'competitions': 'Compétitions',
  'progressions': 'Progressions',
  'contact': 'Contact',
  'galerie': 'Galerie',
  'partenaires': 'Partenaires',
  'planning': 'Planning',
  'newsletter': 'Newsletter',
  'newsletters': 'Archives',
  'boutique': 'Boutique',
  'marketplace': 'Marketplace',
  'mentions-legales': 'Mentions Légales',
  'politique-confidentialite': 'Confidentialité',
  'politique-cookies': 'Cookies',
  'a-propos': 'À Propos',
  'clubs-paca': 'Clubs PACA',
  'espace-membre': 'Espace Membre',
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Générer automatiquement les breadcrumbs si non fournis
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    const segments = pathname?.split('/').filter(Boolean) || []
    const breadcrumbs: BreadcrumbItem[] = []

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      
      // Ne pas afficher les IDs numériques ou les segments dynamiques
      if (/^\d+$/.test(segment)) {
        breadcrumbs.push({
          label: 'Détails',
          href: isLast ? undefined : currentPath
        })
      } else {
        breadcrumbs.push({
          label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href: isLast ? undefined : currentPath
        })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length === 0) return null

  return (
    <nav aria-label="Fil d'Ariane" className={`text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link 
            href="/" 
            className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            <i className="fas fa-home text-xs"></i>
            <span className="hidden sm:inline">Accueil</span>
          </Link>
        </li>
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            {item.href ? (
              <Link 
                href={item.href}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-primary font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
