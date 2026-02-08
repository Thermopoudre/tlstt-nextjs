'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdminHeaderProps {
  admin: any
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  const pathname = usePathname()
  const [newMessagesCount, setNewMessagesCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    const supabase = createClient()
    
    // Count new messages
    const { count } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')

    setNewMessagesCount(count || 0)

    // Get last 5 new messages as notifications
    const { data } = await supabase
      .from('contact_messages')
      .select('id, name, subject, created_at')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5)

    setNotifications(data || [])
  }

  const getBreadcrumb = () => {
    const parts = pathname?.split('/').filter(Boolean) || []
    return parts.map((part, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/')
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
      return { label, path }
    })
  }

  const breadcrumb = getBreadcrumb()

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'à l\'instant'
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`
    if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`
    return `il y a ${Math.floor(seconds / 86400)}j`
  }

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
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fas fa-bell text-lg"></i>
                {newMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
                    {newMessagesCount > 9 ? '9+' : newMessagesCount}
                  </span>
                )}
              </button>

              {/* Dropdown notifications */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    {newMessagesCount > 0 && (
                      <span className="bg-red-500 text-white px-2 py-0.5 text-xs rounded-full">
                        {newMessagesCount} nouveau{newMessagesCount > 1 ? 'x' : ''}
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href="/admin/messages"
                          onClick={() => setShowNotifications(false)}
                          className="block p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <i className="fas fa-envelope text-blue-600 text-xs"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {n.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{n.subject || 'Sans objet'}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-400">
                        <i className="fas fa-check-circle text-2xl mb-2"></i>
                        <p className="text-sm">Aucune notification</p>
                      </div>
                    )}
                  </div>
                  {newMessagesCount > 0 && (
                    <Link
                      href="/admin/messages"
                      onClick={() => setShowNotifications(false)}
                      className="block p-2.5 text-center text-sm text-primary font-semibold hover:bg-gray-50 border-t"
                    >
                      Voir tous les messages
                    </Link>
                  )}
                </div>
              )}
            </div>

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
