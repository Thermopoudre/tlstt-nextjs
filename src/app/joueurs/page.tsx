import { createClient } from '@/lib/supabase/server'
import JoueursClient from './JoueursClient'

export default async function JoueursPage() {
  const supabase = await createClient()

  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .ilike('admin_notes', '%TLSTT%')

  if (error) {
    console.error('Erreur Supabase:', error)
  }

  return <JoueursClient initialPlayers={players || []} />
}
