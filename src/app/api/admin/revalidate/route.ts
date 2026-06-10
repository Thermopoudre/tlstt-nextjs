import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createReadOnlyClient } from '@/lib/supabase/server'

// Revalidation à la demande : rend immédiatement visibles sur le site public les
// modifications faites dans le back-office (sinon cache ISR jusqu'à 60 min).
export async function POST() {
  try {
    const supabase = await createReadOnlyClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: admin } = await supabase
      .from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
    if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

    // Revalide toutes les pages partageant le layout racine = tout le site public
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, revalidatedAt: new Date().toISOString() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
