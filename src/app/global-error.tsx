'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Le site rencontre un incident</h1>
            <p style={{ color: '#9ca3af', marginBottom: 24 }}>
              Nous ne parvenons pas à afficher cette page. Réessayez dans un instant.
            </p>
            <button
              onClick={reset}
              style={{ background: '#3b9fd8', color: '#fff', border: 0, padding: '12px 24px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}
            >
              Réessayer
            </button>
            {error.digest && <p style={{ color: '#4b5563', fontSize: 12, marginTop: 24 }}>Référence : {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  )
}
