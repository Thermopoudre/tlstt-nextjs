'use client'

import { useState } from 'react'

export default function AdminEmailPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/email/test')
      const data = await res.json()
      setTestResult(data)
    } catch (err) {
      setTestResult({ error: 'Erreur de connexion' })
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
    } catch (err) {
      setSendResult({ success: false, error: 'Erreur de connexion' })
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary">Configuration Email</h1>
        <p className="text-gray-600 mt-1">Configuration SMTP pour l&apos;envoi d&apos;emails</p>
      </div>

      {/* Guide Gmail */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fab fa-google mr-2 text-red-500"></i>
          Configuration Gmail SMTP
        </h2>
        <div className="space-y-4 text-gray-600">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Etapes de configuration :</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>Connectez-vous a votre compte Gmail du club</li>
              <li>Activez la <strong>validation en 2 etapes</strong> dans les parametres de securite Google</li>
              <li>Allez sur <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com/apppasswords</a></li>
              <li>Creez un mot de passe d&apos;application pour &quot;Mail&quot;</li>
              <li>Copiez le mot de passe genere (16 caracteres)</li>
              <li>Ajoutez les variables d&apos;environnement dans Vercel</li>
            </ol>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Variables d&apos;environnement Vercel :</h3>
            <div className="font-mono text-sm space-y-1 bg-gray-900 text-green-400 p-3 rounded-lg">
              <div>SMTP_HOST=smtp.gmail.com</div>
              <div>SMTP_PORT=587</div>
              <div>SMTP_USER=votre-email@gmail.com</div>
              <div>SMTP_PASS=xxxx xxxx xxxx xxxx</div>
              <div>SMTP_FROM=TLSTT &lt;votre-email@gmail.com&gt;</div>
              <div>SMTP_ADMIN_EMAIL=votre-email@gmail.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test de connexion */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-plug mr-2 text-primary"></i>
          Test de connexion SMTP
        </h2>
        <div className="flex gap-4 mb-4">
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
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            {sending ? (
              <><i className="fas fa-spinner fa-spin"></i>Envoi...</>
            ) : (
              <><i className="fas fa-paper-plane"></i>Envoyer un email test</>
            )}
          </button>
        </div>

        {/* Resultats du test */}
        {testResult && (
          <div className={`rounded-lg p-4 ${testResult.connection?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-bold mb-2 ${testResult.connection?.success ? 'text-green-800' : 'text-red-800'}`}>
              <i className={`fas ${testResult.connection?.success ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
              {testResult.connection?.success ? 'Connexion SMTP OK' : 'Erreur de connexion'}
            </h3>
            <div className="text-sm space-y-1">
              <div><strong>Host :</strong> {testResult.smtp?.host}</div>
              <div><strong>Port :</strong> {testResult.smtp?.port}</div>
              <div><strong>User :</strong> {testResult.smtp?.user}</div>
              <div><strong>Configure :</strong> {testResult.smtp?.configured ? 'Oui' : 'Non'}</div>
              {testResult.connection?.error && (
                <div className="text-red-600 mt-2"><strong>Erreur :</strong> {testResult.connection.error}</div>
              )}
            </div>
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

      {/* Fonctionnalites email */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-envelope mr-2 text-primary"></i>
          Emails automatiques
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Notification contact</h3>
                <p className="text-xs text-gray-500">Actif</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Email envoye a l&apos;admin quand un visiteur utilise le formulaire de contact.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Email de bienvenue</h3>
                <p className="text-xs text-gray-500">Actif</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Email envoye aux nouveaux membres lors de leur inscription.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Newsletter</h3>
                <p className="text-xs text-gray-500">A venir</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Envoi de newsletters aux abonnes.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Communications secretariat</h3>
                <p className="text-xs text-gray-500">A venir</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Messages du secretariat aux membres du club.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
