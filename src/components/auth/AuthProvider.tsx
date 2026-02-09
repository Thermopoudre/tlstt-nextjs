'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface MemberProfile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  address: string | null
  birth_date: string | null
  licence_fftt: string | null
  avatar_url: string | null
  newsletter_subscribed: boolean
  secretariat_notifications: boolean
  membership_status: 'pending' | 'active' | 'expired'
  membership_expires_at: string | null
  role?: 'visitor' | 'member' | 'admin'
  is_validated?: boolean
}

interface AuthContextType {
  user: SupabaseUser | null
  profile: MemberProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profileData: Partial<MemberProfile>) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Charger le profil utilisateur
  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('member_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  // Rafraîchir le profil
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  useEffect(() => {
    // Vérifier la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Connexion
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // Inscription
  const signUp = async (email: string, password: string, profileData: Partial<MemberProfile>) => {
    // Passer les metadata dans le signUp - le trigger DB crée automatiquement le profil
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || null,
          licence_fftt: profileData.licence_fftt || null,
          newsletter_subscribed: profileData.newsletter_subscribed ?? true,
          role: profileData.role || 'visitor',
        }
      }
    })
    if (error) throw error

    // Fallback: si le trigger n'a pas créé le profil et que l'utilisateur est connecté
    if (data.user && data.session) {
      const { data: existing } = await supabase
        .from('member_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        await supabase.from('member_profiles').insert({
          id: data.user.id,
          ...profileData,
          membership_status: 'pending',
          is_validated: false,
        })
      }
    }
  }

  // Déconnexion
  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
