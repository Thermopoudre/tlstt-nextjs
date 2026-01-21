import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

interface RouteParams {
  params: Promise<{ licence: string }>
}

// GET - Récupère les données fraîches depuis SmartPing
export async function GET(request: Request, { params }: RouteParams) {
  const { licence } = await params
  const supabase = await createClient()

  try {
    const appId = process.env.SMARTPING_APP_ID || ''
    const password = process.env.SMARTPING_PASSWORD || ''
    const serie = process.env.SMARTPING_SERIE || ''

    // Vérifier si on a les credentials
    if (!appId || !password || !serie) {
      // Retourner les données Supabase existantes sans refresh
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('smartping_licence', licence)
        .single()

      return NextResponse.json({
        player,
        source: 'cache',
        message: 'Credentials SmartPing manquants - données cache uniquement'
      })
    }

    // Générer les paramètres d'authentification
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // Appels API en parallèle pour optimiser le temps
    const [joueurResponse, partiesResponse, histoResponse] = await Promise.all([
      // 1. Détails joueur (xml_joueur.php)
      fetch(`https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${licence}`, { cache: 'no-store' }),
      // 2. Parties jouées (xml_partie_mysql.php)
      fetch(`https://www.fftt.com/mobile/pxml/xml_partie_mysql.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${licence}`, { cache: 'no-store' }),
      // 3. Historique classement (xml_histo_classement.php)
      fetch(`https://www.fftt.com/mobile/pxml/xml_histo_classement.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numlic=${licence}`, { cache: 'no-store' })
    ])

    const [joueurXml, partiesXml, histoXml] = await Promise.all([
      joueurResponse.text(),
      partiesResponse.text(),
      histoResponse.text()
    ])

    // Parser les données joueur
    const playerData = parseJoueurXml(joueurXml)
    
    // Parser les parties
    const parties = parsePartiesXml(partiesXml)
    
    // Parser l'historique
    const historique = parseHistoXml(histoXml)

    // Calculer les statistiques
    const stats = calculateStats(parties)

    // Mettre à jour Supabase avec les nouvelles données
    if (playerData) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('smartping_licence', licence)
        .single()

      if (existingPlayer) {
        await supabase
          .from('players')
          .update({
            fftt_points: playerData.pointsOfficiel,
            fftt_points_exact: playerData.pointsMensuels || playerData.pointsOfficiel,
            category: playerData.echelon === 'N' ? `N${playerData.place}` : playerData.categorie,
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlayer.id)
      }
    }

    // Récupérer les données mises à jour
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('smartping_licence', licence)
      .single()

    return NextResponse.json({
      player: {
        ...player,
        // Enrichir avec données SmartPing
        pointsMensuels: playerData?.pointsMensuels,
        progressionAnnuelle: playerData?.progressionAnnuelle,
        progressionMensuelle: playerData?.progressionMensuelle,
        rangDepartemental: playerData?.rangDep,
        rangRegional: playerData?.rangReg,
        rangNational: playerData?.rangNat,
        classementGlobal: playerData?.clGlob,
        nationalite: playerData?.natio,
        categorie: playerData?.categorie,
        echelon: playerData?.echelon,
        place: playerData?.place
      },
      parties: parties.slice(0, 20), // 20 dernières parties
      historique,
      stats,
      source: 'api',
      lastSync: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur API player:', error)
    
    // En cas d'erreur, retourner les données cache
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('smartping_licence', licence)
      .single()

    return NextResponse.json({
      player,
      parties: [],
      historique: [],
      stats: null,
      source: 'cache',
      error: error.message
    })
  }
}

// Parser XML joueur
function parseJoueurXml(xml: string) {
  if (!xml || xml.includes('<erreur>')) return null

  const getValue = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
    return match ? match[1] : null
  }

  return {
    licence: getValue('licence'),
    nom: getValue('nom'),
    prenom: getValue('prenom'),
    club: getValue('club'),
    nclub: getValue('nclub'),
    natio: getValue('natio'),
    clGlob: getValue('clglob'),
    pointsOfficiel: parseInt(getValue('point') || '0'),
    pointsMensuels: parseInt(getValue('point') || '0'), // point = situation mensuelle
    ancienPoints: parseInt(getValue('apoint') || '0'),
    clast: getValue('clast'),
    categorie: getValue('categ'),
    rangReg: getValue('rangreg'),
    rangDep: getValue('rangdep'),
    valCla: parseInt(getValue('valcla') || '0'),
    echelon: getValue('echelon') || '', // N si classé national
    place: getValue('place') || '', // rang si classé national
    progressionAnnuelle: 0, // À calculer depuis historique
    progressionMensuelle: 0
  }
}

// Parser XML parties
function parsePartiesXml(xml: string) {
  if (!xml || xml.includes('<erreur>')) return []

  const parties: any[] = []
  const partieMatches = xml.matchAll(/<partie>([\s\S]*?)<\/partie>/g)

  for (const match of partieMatches) {
    const partieXml = match[1]
    const getValue = (tag: string) => {
      const m = partieXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : null
    }

    parties.push({
      date: getValue('date'),
      adversaire: getValue('advnompre'),
      adversaireLicence: getValue('advlic'),
      adversaireSexe: getValue('advsexe'),
      adversaireClassement: getValue('advclaof'),
      victoire: getValue('vd') === 'V',
      pointsResultat: parseFloat(getValue('pointres') || '0'),
      coefficient: parseFloat(getValue('coefchamp') || '1'),
      journee: getValue('numjourn'),
      codeChamp: getValue('codechamp')
    })
  }

  return parties.sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime()
    const dateB = new Date(b.date || 0).getTime()
    return dateB - dateA
  })
}

// Parser XML historique
function parseHistoXml(xml: string) {
  if (!xml || xml.includes('<erreur>')) return []

  const historique: any[] = []
  const histoMatches = xml.matchAll(/<histo>([\s\S]*?)<\/histo>/g)

  for (const match of histoMatches) {
    const histoXml = match[1]
    const getValue = (tag: string) => {
      const m = histoXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : null
    }

    historique.push({
      saison: getValue('saison'),
      phase: getValue('phase'),
      points: parseInt(getValue('point') || '0'),
      echelon: getValue('echelon'),
      place: getValue('place')
    })
  }

  return historique
}

// Calculer statistiques
function calculateStats(parties: any[]) {
  if (!parties.length) return null

  const victoires = parties.filter(p => p.victoire).length
  const defaites = parties.length - victoires
  const pointsGagnes = parties.reduce((sum, p) => sum + (p.victoire ? p.pointsResultat : 0), 0)
  const pointsPerdus = parties.reduce((sum, p) => sum + (!p.victoire ? Math.abs(p.pointsResultat) : 0), 0)

  return {
    total: parties.length,
    victoires,
    defaites,
    pourcentage: Math.round((victoires / parties.length) * 100),
    pointsGagnes: Math.round(pointsGagnes),
    pointsPerdus: Math.round(pointsPerdus),
    bilan: Math.round(pointsGagnes - pointsPerdus)
  }
}

// Générer timestamp
function generateTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}${ms}`
}

// Crypter timestamp
function encryptTimestamp(timestamp: string, password: string): string {
  const md5Key = crypto.createHash('md5').update(password).digest('hex')
  const hmac = crypto.createHmac('sha1', md5Key)
  hmac.update(timestamp)
  return hmac.digest('hex')
}
