'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminHelloAssoPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    helloasso_org_slug: '',
    helloasso_cotisation_url: '',
    helloasso_boutique_url: '',
  })

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['helloasso_org_slug', 'helloasso_cotisation_url', 'helloasso_boutique_url'])

      if (data) {
        const newForm = { ...form }
        data.forEach(s => {
          if (s.setting_key in newForm) {
            (newForm as any)[s.setting_key] = s.setting_value || ''
          }
        })
        setForm(newForm)
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    for (const [key, value] of Object.entries(form)) {
      await supabase
        .from('settings')
        .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary">Integration HelloAsso</h1>
        <p className="text-gray-600 mt-1">Configurez les liens de paiement HelloAsso pour les cotisations et la boutique</p>
      </div>

      {/* Guide HelloAsso */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-info-circle mr-2 text-[#4c40cf]"></i>
          Comment ca fonctionne ?
        </h2>
        <div className="space-y-3 text-gray-600 text-sm">
          <p><strong>1.</strong> Creez vos campagnes sur <a href="https://www.helloasso.com" target="_blank" rel="noopener noreferrer" className="text-[#4c40cf] underline font-semibold">HelloAsso.com</a> (gratuit pour les associations)</p>
          <p><strong>2.</strong> Creez une campagne <strong>Adhesion</strong> pour les cotisations de la saison</p>
          <p><strong>3.</strong> Creez une campagne <strong>Boutique</strong> pour les achats de materiel</p>
          <p><strong>4.</strong> Copiez les URLs de vos campagnes ci-dessous</p>
          <p><strong>5.</strong> Les boutons &quot;Payer avec HelloAsso&quot; apparaitront automatiquement sur le site</p>
        </div>
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">
            <i className="fas fa-check-circle mr-2"></i>
            <strong>Avantage :</strong> HelloAsso est 100% gratuit pour les associations.
            Aucun frais de transaction n&apos;est preleve sur les paiements.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-building mr-2 text-primary"></i>
              Slug de l&apos;organisation HelloAsso
            </label>
            <input
              type="text"
              value={form.helloasso_org_slug}
              onChange={e => setForm({ ...form, helloasso_org_slug: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ex: tlstt ou toulon-la-seyne-tennis-de-table"
            />
            <p className="text-xs text-gray-500 mt-1">
              Visible dans l&apos;URL de votre page HelloAsso : helloasso.com/associations/<strong>votre-slug</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-id-card mr-2 text-green-600"></i>
              URL Cotisation / Adhesion
            </label>
            <input
              type="url"
              value={form.helloasso_cotisation_url}
              onChange={e => setForm({ ...form, helloasso_cotisation_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://www.helloasso.com/associations/tlstt/adhesions/saison-2025-2026"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lien vers la campagne d&apos;adhesion pour les cotisations.
              Apparaitra sur la page Boutique.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-shopping-bag mr-2 text-blue-600"></i>
              URL Boutique HelloAsso
            </label>
            <input
              type="url"
              value={form.helloasso_boutique_url}
              onChange={e => setForm({ ...form, helloasso_boutique_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://www.helloasso.com/associations/tlstt/boutiques/boutique-tlstt"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lien vers la boutique HelloAsso pour les achats.
              Le bouton &quot;Commander&quot; redirigera vers cette page.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <><i className="fas fa-spinner fa-spin"></i>Enregistrement...</>
              ) : (
                <><i className="fas fa-save"></i>Enregistrer</>
              )}
            </button>
            {saved && (
              <span className="text-green-600 font-semibold text-sm">
                <i className="fas fa-check-circle mr-1"></i>Enregistre !
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Apercu */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-eye mr-2 text-primary"></i>
          Apercu de l&apos;integration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border rounded-lg p-4 ${form.helloasso_cotisation_url ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <i className={`fas fa-id-card text-xl ${form.helloasso_cotisation_url ? 'text-green-600' : 'text-gray-400'}`}></i>
              <div>
                <h3 className="font-semibold text-gray-800">Cotisation</h3>
                <p className="text-xs text-gray-500">{form.helloasso_cotisation_url ? 'Configure' : 'Non configure'}</p>
              </div>
            </div>
            {form.helloasso_cotisation_url && (
              <a href={form.helloasso_cotisation_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#4c40cf] underline break-all">{form.helloasso_cotisation_url}</a>
            )}
          </div>
          <div className={`border rounded-lg p-4 ${form.helloasso_boutique_url ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <i className={`fas fa-shopping-bag text-xl ${form.helloasso_boutique_url ? 'text-green-600' : 'text-gray-400'}`}></i>
              <div>
                <h3 className="font-semibold text-gray-800">Boutique</h3>
                <p className="text-xs text-gray-500">{form.helloasso_boutique_url ? 'Configure' : 'Non configure'}</p>
              </div>
            </div>
            {form.helloasso_boutique_url && (
              <a href={form.helloasso_boutique_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#4c40cf] underline break-all">{form.helloasso_boutique_url}</a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
