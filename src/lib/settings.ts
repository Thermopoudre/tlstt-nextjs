import { createClient } from './supabase/server'

export interface GlobalSettings {
  site_name: string
  site_description: string
  club_number: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  postal_code: string
  foundation_year: number
  facebook_url: string
  instagram_url: string
  club_description: string
  nb_tables: number
  surface: string
  nb_licencies: number
  nb_equipes: number
  nb_entraineurs: number
  president_name: string
  maps_url: string
}

const defaultGlobalSettings: GlobalSettings = {
  site_name: 'TLSTT',
  site_description: 'Toulon La Seyne Tennis de Table',
  club_number: '13830083',
  contact_email: 'contact@tlstt.fr',
  contact_phone: '',
  address: 'Gymnase Léo Lagrange, Avenue Maréchal Juin',
  city: 'La Seyne-sur-Mer',
  postal_code: '83500',
  foundation_year: 1954,
  facebook_url: 'https://www.facebook.com/tlstt83',
  instagram_url: 'https://www.instagram.com/tlstt_officiel',
  club_description: 'Club de tennis de table affilié à la FFTT.',
  nb_tables: 12,
  surface: '800m²',
  nb_licencies: 150,
  nb_equipes: 13,
  nb_entraineurs: 4,
  president_name: '',
  maps_url: 'https://maps.google.com/?q=Gymnase+Léo+Lagrange+La+Seyne',
}

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('page', 'global')
    .single()

  return { ...defaultGlobalSettings, ...(data?.settings as Partial<GlobalSettings> || {}) }
}

export async function getContactSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('page', 'contact')
    .single()

  return data?.settings as {
    subjects: string[]
    opening_hours: Record<string, string>
  } || {
    subjects: ['Question générale', 'Inscription', 'Partenariat', 'Autre'],
    opening_hours: {
      lundi_vendredi: '17h30 - 23h',
      mercredi: '14h - 23h',
      samedi: '9h - 19h',
      dimanche: 'Compétitions',
    },
  }
}

export async function getClubSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('page', 'club')
    .single()

  return data?.settings as {
    history: string
    palmares: { title: string; description: string; icon: string; color: string }[]
    values: { title: string; description: string; icon: string; color: string }[]
    equipments: string[]
  } || {
    history: '',
    palmares: [],
    values: [],
    equipments: [],
  }
}

export async function getPlanningSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('page', 'planning')
    .single()

  return data?.settings as {
    tarifs: { label: string; price: string; period: string }[]
    infos_pratiques: string[]
    location: string
  } || {
    tarifs: [],
    infos_pratiques: [],
    location: '',
  }
}

export async function getPageContent(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pages_content')
    .select('*')
    .eq('slug', slug)
    .single()

  return data as { slug: string; title: string; content: string; updated_at: string } | null
}
