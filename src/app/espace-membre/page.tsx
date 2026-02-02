'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface Communication {
  id: string
  title: string
  content: string
  type: 'info' | 'important' | 'urgent'
  sent_at: string
}

export default function EspaceMembrePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [loading, user, router])

  useEffect(() => {
    const fetchCommunications = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('secretariat_communications')
        .select('*')
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(5)
      setCommunications(data || [])
    }
    if (user) fetchCommunications()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8]"></i>
      </div>
    )
  }

  if (!user) return null

  const isActive = profile?.membership_status === 'active'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="py-12 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Bienvenue, <span className="text-[#3b9fd8]">{profile?.first_name || 'Membre'}</span> !
              </h1>
              <p className="text-gray-500">
                Votre espace personnel TLSTT
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold border ${
              isActive ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
            }`}>
              <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-clock'} mr-2`}></i>
              {isActive ? 'Membre actif' : 'En attente de validation'}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 -mt-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/espace-membre/profil" className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center hover:border-[#3b9fd8]/50 transition-colors">
            <div className="w-12 h-12 bg-[#3b9fd8] rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-user text-white text-xl"></i>
            </div>
            <div className="text-white font-semibold">Mon Profil</div>
          </Link>

          <Link href="/boutique" className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center hover:border-green-500/50 transition-colors">
            <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-shopping-bag text-white text-xl"></i>
            </div>
            <div className="text-white font-semibold">Boutique Club</div>
          </Link>

          <Link href="/marketplace" className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-exchange-alt text-white text-xl"></i>
            </div>
            <div className="text-white font-semibold">Marketplace</div>
          </Link>

          <Link href="/espace-membre/commandes" className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center hover:border-orange-500/50 transition-colors">
            <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-box text-white text-xl"></i>
            </div>
            <div className="text-white font-semibold">Mes Commandes</div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Communications Secrétariat */}
          <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-bullhorn mr-2 text-[#3b9fd8]"></i>
              Communications du Secrétariat
            </h2>
            {communications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-inbox text-4xl mb-2"></i>
                <p>Aucune communication pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {communications.map(comm => (
                  <div key={comm.id} className={`p-4 rounded-xl border ${
                    comm.type === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
                    comm.type === 'important' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-[#111] border-[#333]'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {comm.type === 'urgent' && <span className="text-red-400 text-xs font-bold uppercase">Urgent</span>}
                          {comm.type === 'important' && <span className="text-yellow-400 text-xs font-bold uppercase">Important</span>}
                          <h3 className="text-white font-semibold">{comm.title}</h3>
                        </div>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{comm.content}</p>
                      </div>
                      <div className="text-gray-600 text-xs whitespace-nowrap">
                        {new Date(comm.sent_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infos rapides */}
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-id-card mr-2 text-[#3b9fd8]"></i>
                Ma Licence
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">N° Licence</span>
                  <span className="text-white font-mono">{profile?.licence_fftt || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiration</span>
                  <span className="text-white">
                    {profile?.membership_expires_at 
                      ? new Date(profile.membership_expires_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                <i className="fas fa-bell mr-2 text-[#3b9fd8]"></i>
                Notifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Newsletter</span>
                  <span className={`text-sm ${profile?.newsletter_subscribed ? 'text-green-400' : 'text-red-400'}`}>
                    {profile?.newsletter_subscribed ? 'Activée' : 'Désactivée'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Secrétariat</span>
                  <span className={`text-sm ${profile?.secretariat_notifications ? 'text-green-400' : 'text-red-400'}`}>
                    {profile?.secretariat_notifications ? 'Activées' : 'Désactivées'}
                  </span>
                </div>
              </div>
              <Link href="/espace-membre/profil" className="block mt-4 text-[#3b9fd8] text-sm hover:underline">
                Gérer mes préférences →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
