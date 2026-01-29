'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AdminMentionsLegalesPage() {
  const supabase = createClientComponentClient()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    const { data } = await supabase
      .from('pages_content')
      .select('*')
      .eq('slug', 'mentions-legales')
      .single()
    
    if (data?.content) {
      setContent(data.content)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('pages_content')
      .upsert({
        slug: 'mentions-legales',
        title: 'Mentions Légales',
        content: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'slug' })

    if (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } else {
      setMessage({ type: 'success', text: 'Modifications enregistrées !' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Mentions Légales</h1>
          <p className="text-gray-600 mt-1">Éditez le contenu de la page mentions légales</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/mentions-legales"
            target="_blank"
            className="btn-secondary flex items-center gap-2"
          >
            <i className="fas fa-external-link"></i>
            Voir
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* Editor */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Contenu (Markdown supporté)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={25}
            className="input-field font-mono text-sm"
            placeholder="# Mentions Légales\n\n## Éditeur\n...\n\n## Hébergement\n..."
          />
        </div>
        <div className="text-sm text-gray-500">
          <i className="fas fa-info-circle mr-1"></i>
          Vous pouvez utiliser la syntaxe Markdown pour formater le texte.
        </div>
      </div>
    </div>
  )
}
