'use client'

import { useEffect, useMemo, useState } from 'react'
import { createUiClient as createClient } from '@/lib/supabase/ui-client'
import ConfirmModal from '@/components/admin/ConfirmModal'

export type Groupe = {
  id: number
  name: string
  description: string | null
  extra_emails: string[]
  membres: string[] // ids des membres
}

type Membre = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  is_validated: boolean
}

export function nomComplet(m: Pick<Membre, 'first_name' | 'last_name' | 'email'>): string {
  const n = `${m.first_name || ''} ${m.last_name || ''}`.trim()
  return n || m.email || 'Membre sans nom'
}

/** Charge les groupes avec la liste des membres rattachés. */
export async function chargerGroupes(): Promise<Groupe[]> {
  const supabase = createClient()
  const [{ data: groupes }, { data: liens }] = await Promise.all([
    supabase.from('newsletter_groups').select('*').order('name'),
    supabase.from('newsletter_group_members').select('group_id, member_id'),
  ])
  return (groupes || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    extra_emails: g.extra_emails || [],
    membres: (liens || []).filter((l: any) => l.group_id === g.id).map((l: any) => l.member_id),
  }))
}

export default function GroupesNewsletter({ onChange }: { onChange?: () => void }) {
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<number | null>(null)
  const [nouveauNom, setNouveauNom] = useState('')
  const [recherche, setRecherche] = useState('')
  const [coches, setCoches] = useState<Set<string>>(new Set())
  const [extra, setExtra] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [suppression, setSuppression] = useState<number | null>(null)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    const [g, r] = await Promise.all([chargerGroupes(), fetch('/api/admin/members-directory').then(x => x.json()).catch(() => ({}))])
    setGroupes(g)
    setMembres((r?.membres || []).filter((m: Membre) => m.is_validated))
    setLoading(false)
  }

  const ouvrir = (g: Groupe) => {
    setSelection(g.id)
    setNom(g.name)
    setDescription(g.description || '')
    setCoches(new Set(g.membres))
    setExtra((g.extra_emails || []).join('\n'))
    setRecherche('')
    setMessage(null)
  }

  const creer = async () => {
    const name = nouveauNom.trim()
    if (!name) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('newsletter_groups').insert({ name }).select('*').single()
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message.includes('duplicate') ? 'Un groupe porte déjà ce nom.' : error.message }); return }
    setNouveauNom('')
    const liste = await chargerGroupes()
    setGroupes(liste)
    const g = liste.find(x => x.id === data.id)
    if (g) ouvrir(g)
    onChange?.()
  }

  const enregistrer = async () => {
    if (selection === null) return
    const name = nom.trim()
    if (!name) { setMessage({ type: 'error', text: 'Le nom du groupe est obligatoire.' }); return }
    setSaving(true)
    const supabase = createClient()
    const emails = extra.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    const { error: e1 } = await supabase.from('newsletter_groups')
      .update({ name, description: description.trim() || null, extra_emails: emails, updated_at: new Date().toISOString() })
      .eq('id', selection)
    if (e1) { setSaving(false); setMessage({ type: 'error', text: e1.message }); return }
    // Remplace la liste des membres du groupe
    const { error: e2 } = await supabase.from('newsletter_group_members').delete().eq('group_id', selection)
    if (e2) { setSaving(false); setMessage({ type: 'error', text: e2.message }); return }
    if (coches.size > 0) {
      const { error: e3 } = await supabase.from('newsletter_group_members')
        .insert([...coches].map(member_id => ({ group_id: selection, member_id })))
      if (e3) { setSaving(false); setMessage({ type: 'error', text: e3.message }); return }
    }
    setSaving(false)
    setMessage({ type: 'success', text: `Groupe « ${name} » enregistré : ${coches.size} membre(s)${emails.length ? ` + ${emails.length} adresse(s)` : ''}.` })
    setGroupes(await chargerGroupes())
    onChange?.()
  }

  const supprimer = async () => {
    if (suppression === null) return
    const supabase = createClient()
    await supabase.from('newsletter_groups').delete().eq('id', suppression)
    setSuppression(null)
    if (selection === suppression) setSelection(null)
    setGroupes(await chargerGroupes())
    onChange?.()
  }

  const basculer = (id: string) => {
    const s = new Set(coches)
    if (s.has(id)) s.delete(id); else s.add(id)
    setCoches(s)
  }

  const membresFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    const liste = q
      ? membres.filter(m => nomComplet(m).toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q))
      : membres
    // Les membres déjà cochés remontent en tête
    return [...liste].sort((a, b) => Number(coches.has(b.id)) - Number(coches.has(a.id)) || nomComplet(a).localeCompare(nomComplet(b), 'fr'))
  }, [membres, recherche, coches])

  if (loading) {
    return <div className="flex justify-center p-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
  }

  const groupeActif = groupes.find(g => g.id === selection) || null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche : liste des groupes */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-900 mb-1"><i className="fas fa-users-cog mr-2 text-primary"></i>Mes groupes</h3>
          <p className="text-sm text-gray-500 mb-4">Un groupe = une liste de personnes à qui envoyer une newsletter ciblée (ex. le Bureau).</p>
          {groupes.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun groupe pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {groupes.map(g => (
                <li key={g.id}>
                  <button type="button" onClick={() => ouvrir(g)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-between gap-2 ${
                      selection === g.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <span className="font-semibold text-gray-900">{g.name}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {g.membres.length + (g.extra_emails?.length || 0)} pers.
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <label className="block text-sm font-bold text-gray-700 mb-2">Créer un nouveau groupe</label>
          <div className="flex gap-2">
            <input type="text" value={nouveauNom} onChange={e => setNouveauNom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') creer() }}
              placeholder="Ex : Bureau, Entraîneurs, Équipe 1…"
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
            <button type="button" onClick={creer} disabled={saving || !nouveauNom.trim()}
              className="bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50">
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Colonne droite : composition du groupe */}
      <div className="lg:col-span-2">
        {!groupeActif ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
            <i className="fas fa-hand-pointer text-4xl mb-3 block text-gray-300"></i>
            <p className="text-lg">Cliquez sur un groupe à gauche pour choisir ses membres,</p>
            <p>ou créez-en un nouveau.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 space-y-5">
            {message && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>{message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du groupe</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description <span className="font-normal text-gray-400">(facultatif)</span></label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-sm font-bold text-gray-700">
                  Membres du groupe
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{coches.size} coché(s)</span>
                </label>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => setCoches(new Set(membresFiltres.map(m => m.id)))} className="text-primary hover:underline">Tout cocher</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={() => setCoches(new Set())} className="text-gray-500 hover:underline">Tout décocher</button>
                </div>
              </div>
              <div className="relative mb-2">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
                  placeholder="Rechercher un membre par nom ou email…"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto divide-y divide-gray-100">
                {membresFiltres.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 italic">Aucun membre ne correspond.</p>
                ) : membresFiltres.map(m => (
                  <label key={m.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${coches.has(m.id) ? 'bg-primary/5' : ''}`}>
                    <input type="checkbox" checked={coches.has(m.id)} onChange={() => basculer(m.id)}
                      className="w-5 h-5 rounded text-primary focus:ring-primary" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-gray-900 truncate">{nomComplet(m)}</span>
                      <span className="block text-xs text-gray-500 truncate">{m.email || 'sans adresse email'}</span>
                    </span>
                    {m.role && m.role !== 'member' && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">{m.role}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Adresses supplémentaires <span className="font-normal text-gray-400">(personnes sans compte sur le site — une adresse par ligne)</span>
              </label>
              <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={3}
                placeholder="prenom.nom@exemple.fr"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-sm" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setSuppression(groupeActif.id)}
                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold">
                <i className="fas fa-trash mr-2"></i>Supprimer ce groupe
              </button>
              <button type="button" onClick={enregistrer} disabled={saving}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:bg-gray-400">
                {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Enregistrement…</> : <><i className="fas fa-save mr-2"></i>Enregistrer le groupe</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={suppression !== null} onConfirm={supprimer} onCancel={() => setSuppression(null)}
        title="Supprimer le groupe"
        message="Le groupe sera supprimé. Les membres, eux, ne sont pas supprimés du site." confirmText="Supprimer" />
    </div>
  )
}
