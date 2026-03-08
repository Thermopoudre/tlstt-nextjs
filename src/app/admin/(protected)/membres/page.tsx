'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  licence_fftt: string | null
  role: string
  is_validated: boolean
  membership_status: string
  created_at: string
}

export default function AdminMembresPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated' | 'visitors'>('all')

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('member_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMembers(data)
    setLoading(false)
  }

  const validateMember = async (id: string) => {
    await supabase.from('member_profiles').update({
      is_validated: true,
      role: 'member',
      membership_status: 'active',
      updated_at: new Date().toISOString()
    }).eq('id', id)
    fetchMembers()
  }

  const rejectMember = async (id: string) => {
    if (!confirm('Refuser ce membre ? Il gardera un compte visiteur.')) return
    await supabase.from('member_profiles').update({
      is_validated: false,
      role: 'visitor',
      membership_status: 'pending',
      updated_at: new Date().toISOString()
    }).eq('id', id)
    fetchMembers()
  }

  const promoteToAdmin = async (id: string) => {
    if (!confirm('Promouvoir cet utilisateur en administrateur ?')) return
    await supabase.from('member_profiles').update({
      role: 'admin',
      is_validated: true,
      membership_status: 'active',
      updated_at: new Date().toISOString()
    }).eq('id', id)
    fetchMembers()
  }

  const filteredMembers = members.filter(m => {
    if (filter === 'pending') return m.role === 'member' && !m.is_validated
    if (filter === 'validated') return m.is_validated
    if (filter === 'visitors') return m.role === 'visitor'
    return true
  })

  const pendingCount = members.filter(m => m.role === 'member' && !m.is_validated).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Gestion des membres</h1>
          <p className="text-gray-600 mt-1">Validez les inscriptions et gerez les roles</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-semibold text-sm">
            <i className="fas fa-bell mr-2"></i>{pendingCount} en attente de validation
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Total inscrits</p>
          <p className="text-2xl font-bold text-primary">{members.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Membres valides</p>
          <p className="text-2xl font-bold text-green-600">{members.filter(m => m.is_validated).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-600">Visiteurs</p>
          <p className="text-2xl font-bold text-gray-400">{members.filter(m => m.role === 'visitor').length}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tous', icon: 'fa-users' },
          { key: 'pending', label: 'En attente', icon: 'fa-clock' },
          { key: 'validated', label: 'Valides', icon: 'fa-check-circle' },
          { key: 'visitors', label: 'Visiteurs', icon: 'fa-user' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${
              filter === f.key ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
            }`}
          >
            <i className={`fas ${f.icon}`}></i>{f.label}
            {f.key === 'pending' && pendingCount > 0 && (
              <span className="bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i></div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Aucun membre</h3>
          <p className="text-gray-500">Les inscriptions apparaitront ici</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Membre</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Licence</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Inscription</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {(member.first_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{member.phone || 'Pas de telephone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {member.licence_fftt || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'member' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role === 'admin' ? 'Admin' : member.role === 'member' ? 'Membre' : 'Visiteur'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.is_validated ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {member.is_validated ? 'Valide' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {member.role === 'member' && !member.is_validated && (
                        <>
                          <button onClick={() => validateMember(member.id)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200"
                            title="Valider">
                            <i className="fas fa-check mr-1"></i>Valider
                          </button>
                          <button onClick={() => rejectMember(member.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200"
                            title="Refuser">
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      {member.role !== 'admin' && member.is_validated && (
                        <button onClick={() => promoteToAdmin(member.id)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200"
                          title="Promouvoir admin">
                          <i className="fas fa-crown"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
