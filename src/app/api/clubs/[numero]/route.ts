import { NextResponse } from 'next/server'
import { smartPingAPI } from '@/lib/smartping/api'

interface RouteParams {
  params: Promise<{ numero: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { numero } = await params

  try {
    const xml = await smartPingAPI.getClubDetail(numero)
    const club = parseClubDetailXml(xml)

    return NextResponse.json({ club, source: 'api' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur API club detail:', message)
    return NextResponse.json({ club: null, error: message }, { status: 500 })
  }
}

function parseClubDetailXml(xml: string) {
  if (!xml || xml.includes('<erreur>')) return null

  const getValue = (tag: string): string => {
    const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
    return m ? m[1] : ''
  }

  const adresse1 = getValue('adressesalle1')
  const adresse2 = getValue('adressesalle2')
  const adresse3 = getValue('adressesalle3')
  const adresse = [adresse1, adresse2, adresse3].filter(Boolean).join(', ')

  return {
    idclub: getValue('idclub'),
    numero: getValue('numero'),
    nomsalle: getValue('nomsalle'),
    adresse,
    adressesalle1: adresse1,
    adressesalle2: adresse2,
    adressesalle3: adresse3,
    codePostal: getValue('codepsalle'),
    ville: getValue('villesalle'),
    web: getValue('web'),
    nomCorrespondant: getValue('nomcor'),
    prenomCorrespondant: getValue('prenomcor'),
    email: getValue('mailcor'),
    telephone: getValue('telcor'),
    latitude: getValue('latitude'),
    longitude: getValue('longitude')
  }
}
