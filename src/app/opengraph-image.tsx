import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TLSTT - Toulon La Seyne Tennis de Table'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0f1923 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 159, 216, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59, 159, 216, 0.1) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, transparent, #3b9fd8, transparent)',
            display: 'flex',
          }}
        />

        {/* Club name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Logo circle placeholder */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              border: '4px solid rgba(59, 159, 216, 0.5)',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0a0a0a',
            }}
          >
            TT
          </div>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
              display: 'flex',
              gap: '16px',
            }}
          >
            <span style={{ color: '#3b9fd8' }}>TLSTT</span>
          </div>

          <div
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              fontWeight: 600,
              letterSpacing: '4px',
              textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            Toulon La Seyne Tennis de Table
          </div>

          {/* Divider */}
          <div
            style={{
              width: '80px',
              height: '4px',
              background: '#3b9fd8',
              borderRadius: '2px',
              margin: '8px 0',
              display: 'flex',
            }}
          />

          <div
            style={{
              fontSize: '22px',
              color: '#64748b',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <span>Club FFTT N. 13830083</span>
            <span style={{ color: '#3b9fd8' }}>|</span>
            <span>Var (83)</span>
            <span style={{ color: '#3b9fd8' }}>|</span>
            <span>Depuis 1954</span>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, transparent, #3b9fd8, transparent)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
