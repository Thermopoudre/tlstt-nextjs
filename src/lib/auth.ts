import { createClient } from './supabase/client'

export interface User {
  id: string
  email: string
  memberProfile?: MemberProfile
}

export interface MemberProfile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  address: string | null
  licence_fftt: string | null
  birth_date: string | null
  avatar_url: string | null
  newsletter_subscribed: boolean
  secretariat_notifications: boolean
  membership_status: 'pending' | 'active' | 'expired'
  membership_expires_at: string | null
}

// Inscription membre
export async function signUp(email: string, password: string, profile: Partial<MemberProfile>) {
  const supabase = createClient()
  
  // 1. Créer le compte auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Erreur lors de la création du compte')

  // 2. Créer le profil membre
  const { error: profileError } = await supabase
    .from('member_profiles')
    .insert({
      id: authData.user.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      licence_fftt: profile.licence_fftt,
      membership_status: 'pending'
    })

  if (profileError) throw profileError

  return authData
}

// Connexion
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Déconnexion
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Récupérer l'utilisateur courant avec son profil
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email || '',
    memberProfile: profile || undefined
  }
}

// Mettre à jour le profil
export async function updateProfile(userId: string, updates: Partial<MemberProfile>) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('member_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) throw error
}

// Vérifier si membre actif
export function isMemberActive(profile: MemberProfile | undefined): boolean {
  if (!profile) return false
  if (profile.membership_status !== 'active') return false
  if (profile.membership_expires_at) {
    const expiry = new Date(profile.membership_expires_at)
    if (expiry < new Date()) return false
  }
  return true
}
