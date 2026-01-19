'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { label: 'Accueil', href: '/' },
    {
      label: 'Actualités',
      href: '/actualites/club',
      submenu: [
        { label: 'Actualités du Club', href: '/actualites/club' },
        { label: 'Actualités Ping', href: '/actualites/tt' },
        { label: 'Handisport', href: '/actualites/handi' },
        { label: 'Newsletters', href: '/newsletters' },
      ],
    },
    { label: 'Équipes', href: '/equipes' },
    {
      label: 'Joueurs',
      href: '/joueurs',
      submenu: [
        { label: 'Liste des Joueurs', href: '/joueurs' },
        { label: 'Top Progressions', href: '/progressions' },
      ],
    },
    {
      label: 'Planning',
      href: '/planning',
      submenu: [
        { label: 'Semaine type', href: '/planning' },
        { label: 'Compétitions', href: '/planning/competitions' },
        { label: 'Événements Club', href: '/planning/evenements' },
      ],
    },
    {
      label: 'Le Club',
      href: '/club',
      submenu: [
        { label: 'À Propos', href: '/club' },
        { label: 'Stages', href: '/stages' },
        { label: 'Challenge', href: '/challenge' },
        { label: 'Clubs PACA', href: '/clubs-paca' },
        { label: 'Boutique', href: '/boutique' },
        { label: 'Galerie Photos', href: '/galerie' },
        { label: 'Nos Partenaires', href: '/partenaires' },
      ],
    },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4">
            <div className="relative w-14 h-14">
              <Image
                src="/logo.jpeg"
                alt="TLSTT Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-heading text-2xl font-extrabold text-[#10325F] leading-tight">
              Toulon La Seyne<br />
              Tennis de Table
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#10325F] text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex gap-1">
              {menuItems.map((item, index) => (
                <li key={index} className="relative group">
                  <Link
                    href={item.href}
                    className="block px-4 py-2 font-semibold text-gray-700 hover:text-[#E31C23] transition-colors"
                  >
                    {item.label}
                    {item.submenu && (
                      <i className="fas fa-chevron-down ml-2 text-xs"></i>
                    )}
                  </Link>

                  {/* Submenu */}
                  {item.submenu && (
                    <ul className="absolute left-0 top-full bg-white shadow-lg rounded-lg py-2 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            className="block px-6 py-2 text-gray-700 hover:bg-[#E31C23] hover:text-white transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4">
            <ul className="flex flex-col gap-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="block px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <ul className="pl-6 flex flex-col gap-1 mt-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            className="block px-4 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
