import { NextResponse } from 'next/server'
import { smartPingAPI } from '@/lib/smartping/api'

// Route TEMPORAIRE de diagnostic : teste si les endpoints FFTT contenant la
// categorie d'age repondent pour ce compte. A supprimer apres usage.
export async function GET() {
  const out: Record<string, string> = {}
  try {
    const o = await smartPingAPI.getLicencies('13830083')
    out['xml_liste_joueur_o'] = o.slice(0, 1200)
  } catch (e) {
    out['xml_liste_joueur_o'] = 'ERREUR: ' + (e instanceof Error ? e.message : String(e))
  }
  try {
    const b = await smartPingAPI.getLicenciesComplet('13830083')
    out['xml_licence_b'] = b.slice(0, 1200)
  } catch (e) {
    out['xml_licence_b'] = 'ERREUR: ' + (e instanceof Error ? e.message : String(e))
  }
  return NextResponse.json(out)
}
