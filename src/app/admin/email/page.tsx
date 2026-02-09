'use client'

import { useState, useEffect } from 'react'

const SMTP_PRESETS: Record<string, { host: string; port: string; secure: string }> = {
  gmail: { host: 'smtp.gmail.com', port: '587', secure: 'false' },
  outlook: { host: 'smtp.office365.com', port: '587', secure: 'false' },
  ionos: { host: 'smtp.ionos.fr', port: '465', secure: 'true' },
  ovh: { host: 'ssl0.ovh.net', port: '465', secure: 'true' },
  custom: { host: '', port: '587', secure: 'false' },
}

export default function AdminEmailPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    smtp_admin_email: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/settings/smtp')
      if (res.ok) {
        const data = await res.json()
        if (data.config) {
          setForm(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(data.config).filter(([, v]) => v !== '')
            ),
          }))
        }
      }
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  const handlePreset = (preset: string) => {
    const p = SMTP_PRESETS[preset]
    if (p) {
      setForm(prev => ({ ...prev, smtp_host: p.host, smtp_port: p.port, smtp_secure: p.secure }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setSaveError('')

    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: form }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur')

      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/email/test')
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ connection: { success: false, error: 'Erreur de connexion au serveur' } })
    }
    setTesting(false)
  }

  const sendTestEmail = async () => {
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/email/test', { method: 'POST' })
      const data = await res.json()
      setSendResult(data)
    } catch {
      setSendResult({ success: false, error: 'Erreur de connexion' })
    }
    setSending(false)
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
        <h1 className="text-2xl lg:text-3xl font-bold text-primary">
          <i className="fas fa-envelope-open-text mr-3"></i>
          Configuration Email (SMTP)
        </h1>
        <p className="text-gray-600 mt-1">
          Configurez le serveur SMTP pour envoyer des emails (newsletters, notifications, contact)
        </p>
      </div>

      {/* Presets rapides */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-bolt mr-2 text-yellow-500"></i>
          Configuration rapide
        </h2>
        <p className="text-sm text-gray-600 mb-4">Selectionnez votre fournisseur pour pre-remplir les parametres du serveur :</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handlePreset('gmail')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-sm"
          >
            <i className="fab fa-google text-red-500"></i>
            Gmail
          </button>
          <button
            type="button"
            onClick={() => handlePreset('outlook')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
          >
            <i className="fab fa-microsoft text-blue-600"></i>
            Outlook / Office 365
          </button>
          <button
            type="button"
            onClick={() => handlePreset('ionos')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm"
          >
            <i className="fas fa-server text-purple-600"></i>
            IONOS
          </button>
          <button
            type="button"
            onClick={() => handlePreset('ovh')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm"
          >
            <i className="fas fa-cloud text-indigo-600"></i>
            OVH
          </button>
          <button
            type="button"
            onClick={() => handlePreset('custom')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-sm"
          >
            <i className="fas fa-cog text-gray-500"></i>
            Personnalise
          </button>
        </div>
      </div>

      {/* Formulaire SMTP */}
      <form onSubmit={handleSave}>
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-800">
            <i className="fas fa-server mr-2 text-primary"></i>
            Parametres du serveur SMTP
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-network-wired mr-1 text-gray-400"></i>
                Serveur SMTP (host)
              </label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={e => setForm({ ...form, smtp_host: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="smtp.gmail.com"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-hashtag mr-1 text-gray-400"></i>
                Port
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={form.smtp_port}
                  onChange={e => setForm({ ...form, smtp_port: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="587"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
                    <input
                      type="checkbox"
                      checked={form.smtp_secure === 'true'}
                      onChange={e => setForm({ ...form, smtp_secure: e.target.checked ? 'true' : 'false' })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    SSL/TLS
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">587 (TLS/STARTTLS) ou 465 (SSL direct)</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <h2 className="text-lg font-bold text-gray-800">
            <i className="fas fa-key mr-2 text-primary"></i>
            Identifiants
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-at mr-1 text-gray-400"></i>
                Email / Identifiant SMTP
              </label>
              <input
                type="email"
                value={form.smtp_user}
                onChange={e => setForm({ ...form, smtp_user: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="votre-email@gmail.com"
              />
            </div>

            {/* Pass */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-lock mr-1 text-gray-400"></i>
                Mot de passe SMTP
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.smtp_pass}
                  onChange={e => setForm({ ...form, smtp_pass: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  placeholder="Mot de passe ou cle d'application"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Pour Gmail : utilisez un &quot;mot de passe d&apos;application&quot;</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <h2 className="text-lg font-bold text-gray-800">
            <i className="fas fa-paper-plane mr-2 text-primary"></i>
            Expediteur
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-user-tag mr-1 text-gray-400"></i>
                Email expediteur (From)
              </label>
              <input
                type="email"
                value={form.smtp_from}
                onChange={e => setForm({ ...form, smtp_from: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="contact@tlstt.fr (defaut: email SMTP)"
              />
              <p className="text-xs text-gray-500 mt-1">Laissez vide pour utiliser l&apos;email SMTP</p>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-user-shield mr-1 text-gray-400"></i>
                Email admin (notifications)
              </label>
              <input
                type="email"
                value={form.smtp_admin_email}
                onChange={e => setForm({ ...form, smtp_admin_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="admin@tlstt.fr (defaut: email SMTP)"
              />
              <p className="text-xs text-gray-500 mt-1">Recoit les notifications de contact, commandes, etc.</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <><i className="fas fa-spinner fa-spin"></i>Enregistrement...</>
              ) : (
                <><i className="fas fa-save"></i>Enregistrer la configuration</>
              )}
            </button>
            {saved && (
              <span className="text-green-600 font-semibold text-sm animate-pulse">
                <i className="fas fa-check-circle mr-1"></i>Configuration enregistree !
              </span>
            )}
            {saveError && (
              <span className="text-red-600 font-semibold text-sm">
                <i className="fas fa-times-circle mr-1"></i>{saveError}
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Test de connexion */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-plug mr-2 text-primary"></i>
          Test de connexion
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Apres avoir enregistre, testez la connexion SMTP et envoyez un email de test.
        </p>
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={testConnection}
            disabled={testing}
            className="btn-primary flex items-center gap-2"
          >
            {testing ? (
              <><i className="fas fa-spinner fa-spin"></i>Test en cours...</>
            ) : (
              <><i className="fas fa-check-circle"></i>Tester la connexion</>
            )}
          </button>
          <button
            onClick={sendTestEmail}
            disabled={sending}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all"
          >
            {sending ? (
              <><i className="fas fa-spinner fa-spin"></i>Envoi...</>
            ) : (
              <><i className="fas fa-paper-plane"></i>Envoyer un email de test</>
            )}
          </button>
        </div>

        {/* Resultats du test */}
        {testResult && (
          <div className={`rounded-lg p-4 ${testResult.connection?.success || testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-bold mb-2 ${testResult.connection?.success || testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              <i className={`fas ${testResult.connection?.success || testResult.success ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
              {testResult.connection?.success || testResult.success ? 'Connexion SMTP OK' : 'Erreur de connexion'}
            </h3>
            {testResult.config && (
              <div className="text-sm space-y-1 mt-2">
                <div><strong>Serveur :</strong> {testResult.config.host}:{testResult.config.port}</div>
                <div><strong>SSL/TLS :</strong> {testResult.config.secure ? 'Oui' : 'Non (STARTTLS)'}</div>
                <div><strong>Utilisateur :</strong> {testResult.config.user}</div>
                <div><strong>Expediteur :</strong> {testResult.config.from}</div>
                <div><strong>Configure :</strong> {testResult.config.configured ? '✅ Oui' : '❌ Non'}</div>
              </div>
            )}
            {testResult.connection?.error && (
              <div className="text-red-600 mt-2 text-sm"><strong>Erreur :</strong> {testResult.connection.error}</div>
            )}
            {testResult.error && !testResult.connection && (
              <div className="text-red-600 mt-2 text-sm"><strong>Erreur :</strong> {testResult.error}</div>
            )}
          </div>
        )}

        {sendResult && (
          <div className={`rounded-lg p-4 mt-4 ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-bold ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
              <i className={`fas ${sendResult.success ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
              {sendResult.success ? 'Email de test envoye avec succes !' : `Echec: ${sendResult.error}`}
            </h3>
          </div>
        )}
      </div>

      {/* Guide Gmail */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fab fa-google mr-2 text-red-500"></i>
          Guide : Configuration Gmail
        </h2>
        <div className="space-y-4 text-gray-600">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Etapes pour Gmail :</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>Connectez-vous a votre compte Gmail du club</li>
              <li>Activez la <strong>validation en 2 etapes</strong> dans les parametres de securite Google</li>
              <li>Allez sur <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com/apppasswords</a></li>
              <li>Creez un mot de passe d&apos;application pour &quot;Mail&quot;</li>
              <li>Copiez le mot de passe genere (16 caracteres) dans le champ ci-dessus</li>
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Important :</strong> N&apos;utilisez jamais votre mot de passe Gmail direct.
              Utilisez toujours un <strong>mot de passe d&apos;application</strong> pour des raisons de securite.
            </p>
          </div>
        </div>
      </div>

      {/* Fonctionnalites email */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-list-check mr-2 text-primary"></i>
          Emails utilisant cette configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-envelope text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Newsletters</h3>
                <p className="text-xs text-green-600 font-semibold">Actif</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Envoi des newsletters aux abonnes depuis le BO.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-bell text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Notifications abonnes</h3>
                <p className="text-xs text-green-600 font-semibold">Actif</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Alerte les abonnes lors de nouvelles publications.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-address-card text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Formulaire de contact</h3>
                <p className="text-xs text-green-600 font-semibold">Actif</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Notification a l&apos;admin quand un visiteur ecrit via le formulaire.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user-plus text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Email de bienvenue</h3>
                <p className="text-xs text-green-600 font-semibold">Actif</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Email envoye aux nouveaux membres lors de leur inscription.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
