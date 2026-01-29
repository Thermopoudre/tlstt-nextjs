'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminHeaderProps {
  admin: any
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  const pathname = usePathname()

  // Générer le breadcrumb
  const getBreadcrumb = () => {
    const parts = pathname?.split('/').filter(Boolean) || []
    return parts.map((part, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/')
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
      return { label, path }
    })
  }

  const breadcrumb = getBreadcrumb()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            {breadcrumb.map((item, index) => (
              <span key={item.path} className="flex items-center gap-2">
                {index > 0 && <i className="fas fa-chevron-right text-gray-400 text-xs"></i>}
                {index === breadcrumb.length - 1 ? (
                  <span className="text-primary font-semibold">{item.label}</span>
                ) : (
                  <Link href={item.path} className="text-gray-500 hover:text-primary">
                    {item.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Mobile Title */}
          <h1 className="sm:hidden text-lg font-bold text-primary ml-12">
            {breadcrumb[breadcrumb.length - 1]?.label || 'Admin'}
          </h1>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Quick Add */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/admin/actualites/nouveau"
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <i className="fas fa-plus"></i>
                <span>Nouvelle actu</span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-500">{admin.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {admin.name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
