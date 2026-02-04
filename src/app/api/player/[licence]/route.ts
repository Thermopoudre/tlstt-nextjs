import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

interface RouteParams {
  params: Promise<{ licence: string }>
}

interface PlayerData {
  licence: string | null
  nom: string | null
  prenom: string | null
  club: string | null
  nclub: string | null
  natio: string | null
  clGlob: string | null
  pointsOfficiel: number
  pointsMensuels: number
  anciensPointsMensuels: number
  pointsInitiaux: number
  ancienPoints: number
  clast: string | null
  categorie: string | null
  rangReg: string | null
  rangDep: string | null
  rangNat: string | null
  valCla: number
  echelon: string
  place: string
  progressionAnnuelle: number
  progressionMensuelle: number
  propositionClassement: string | null
  valeurInitiale: number
}

interface Partie {
  date: string
  dateFormatted: string
  adversaire: string
  adversaireLicence: string | null
  adversaireSexe: string | null
  adversaireClassement: string | null
  victoire: boolean
  pointsResultat: number
  coefficient: number
  journee: string | null
  codeChamp: string | null
}

interface Historique {
  saison: string
  phase: string
  points: number
  echelon: string | null
  place: string | null
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
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('smartping_licence', licence)
        .single()

      return NextResponse.json({
        player,
        source: 'cache',
        message: 'Credentials SmartPing manquants'
      })
    }

    // Générer les paramètres d'authentification
    const tm = generateTimestamp()
    const tmc = encryptTimestamp(tm, password)

    // Appels API en parallèle - tous les endpoints utilisent le même timestamp
    const [joueurResponse, partiesResponse, histoResponse] = await Promise.all([
      // 1. Détails joueur base classement (xml_joueur.php) - endpoint fonctionnel
      fetch(`https://www.fftt.com/mobile/pxml/xml_joueur.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${licence}`, { cache: 'no-store' }),
      // 2. Parties jouées (xml_partie_mysql.php) - endpoint fonctionnel
      fetch(`https://www.fftt.com/mobile/pxml/xml_partie_mysql.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&licence=${licence}`, { cache: 'no-store' }),
      // 3. Historique classement (xml_histo_classement.php)
      fetch(`https://www.fftt.com/mobile/pxml/xml_histo_classement.php?serie=${serie}&tm=${tm}&tmc=${tmc}&id=${appId}&numlic=${licence}`, { cache: 'no-store' })
    ])
    
    // Tenter xml_licence_b.php séparément (peut retourner "Compte incorrect")
    let licenceBResponse: Response | null = null
    try {
      const tm2 = generateTimestamp()
      const tmc2 = encryptTimestamp(tm2, password)
      licenceBResponse = await fetch(
        `https://www.fftt.com/mobile/pxml/xml_licence_b.php?serie=${serie}&tm=${tm2}&tmc=${tmc2}&id=${appId}&licence=${licence}`,
        { cache: 'no-store' }
      )
    } catch {
      // Ignorer les erreurs, xml_joueur.php servira de fallback
    }

    const [joueurXml, partiesXml, histoXml] = await Promise.all([
      joueurResponse.text(),
      partiesResponse.text(),
      histoResponse.text()
    ])
    
    // xml_licence_b si disponible
    let licenceBXml = ''
    if (licenceBResponse) {
      try {
        licenceBXml = await licenceBResponse.text()
        if (licenceBXml.includes('<erreur>')) {
          licenceBXml = '' // Ignorer si erreur
        }
      } catch {
        licenceBXml = ''
      }
    }

    // Parser les données
    const playerData = parseJoueurXml(joueurXml, licenceBXml)
    const parties = parsePartiesXml(partiesXml)
    const historique = parseHistoXml(histoXml)

    // Calculer les statistiques
    const stats = calculateStats(parties)

    // Mettre à jour Supabase
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
        // Enrichir avec toutes les données SmartPing
        pointsMensuels: playerData?.pointsMensuels,
        anciensPointsMensuels: playerData?.anciensPointsMensuels,
        pointsInitiaux: playerData?.pointsInitiaux,
        progressionAnnuelle: playerData?.progressionAnnuelle,
        progressionMensuelle: playerData?.progressionMensuelle,
        rangDepartemental: playerData?.rangDep,
        rangRegional: playerData?.rangReg,
        rangNational: playerData?.rangNat || playerData?.clGlob,
        classementGlobal: playerData?.clGlob,
        nationalite: playerData?.natio,
        categorie: playerData?.categorie,
        echelon: playerData?.echelon,
        place: playerData?.place,
        propositionClassement: playerData?.propositionClassement,
        valeurInitiale: playerData?.valeurInitiale,
        classementOfficiel: playerData?.clast
      },
      parties,
      historique,
      stats,
      source: 'api',
      lastSync: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur API player:', error)
    
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

// Parser XML joueur (combine xml_joueur et xml_licence_b)
// xml_joueur.php contient: licence, nom, prenom, club, nclub, natio, clglob, point (mensuel), 
// apoint (anciens points), clast, categ, rangreg, rangdep, valcla, valinit, clpro
function parseJoueurXml(joueurXml: string, licenceBXml: string): PlayerData | null {
  if (!joueurXml || joueurXml.includes('<erreur>')) {
    // Si xml_joueur.php échoue aussi, on ne peut rien faire
    return null
  }

  const getValueFromJoueur = (tag: string): string | null => {
    const match = joueurXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
    return match ? match[1] : null
  }

  const getValueFromLicence = (tag: string): string | null => {
    if (!licenceBXml) return null
    const match = licenceBXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
    return match ? match[1] : null
  }

  // Points depuis xml_joueur.php (endpoint fonctionnel)
  // point = points mensuels actuels
  // apoint = anciens points mensuels (mois précédent)
  // valinit = valeur initiale (début de saison)
  const point = getValueFromJoueur('point')
  const pointm = getValueFromLicence('pointm') // Fallback vers licence_b si disponible
  const apoint = getValueFromJoueur('apoint')
  const apointm = getValueFromLicence('apointm')
  const valinit = getValueFromJoueur('valinit')
  const initm = getValueFromLicence('initm')

  // Calculer les valeurs numériques - priorité à xml_joueur.php
  const pointsMensuels = parseInt(point || pointm || '0')
  const anciensPointsMensuels = parseInt(apoint || apointm || '0')
  const pointsInitiaux = parseInt(valinit || initm || '0')

  // Calculer les progressions
  const progressionMensuelle = pointsMensuels - (anciensPointsMensuels || pointsMensuels)
  const progressionAnnuelle = pointsMensuels - (pointsInitiaux || pointsMensuels)

  return {
    licence: getValueFromJoueur('licence'),
    nom: getValueFromJoueur('nom'),
    prenom: getValueFromJoueur('prenom'),
    club: getValueFromJoueur('club') || getValueFromLicence('nomclub'),
    nclub: getValueFromJoueur('nclub') || getValueFromLicence('numclub'),
    natio: getValueFromJoueur('natio') || getValueFromLicence('natio'),
    clGlob: getValueFromJoueur('clglob'),
    pointsOfficiel: parseInt(getValueFromJoueur('valcla') || point || '0'),
    pointsMensuels,
    anciensPointsMensuels,
    pointsInitiaux,
    ancienPoints: anciensPointsMensuels,
    clast: getValueFromJoueur('clast') || getValueFromJoueur('claof'),
    categorie: getValueFromJoueur('cat') || getValueFromJoueur('categ') || getValueFromLicence('cat'),
    rangReg: getValueFromJoueur('rangreg'),
    rangDep: getValueFromJoueur('rangdep'),
    rangNat: getValueFromJoueur('clglob'),
    valCla: parseInt(getValueFromJoueur('valcla') || '0'),
    echelon: getValueFromJoueur('echelon') || getValueFromLicence('echelon') || '',
    place: getValueFromJoueur('place') || getValueFromLicence('place') || '',
    progressionAnnuelle,
    progressionMensuelle,
    propositionClassement: getValueFromJoueur('clpro'),
    valeurInitiale: pointsInitiaux
  }
}

// Parser date française DD/MM/YYYY -> ISO string
function parseFrenchDate(dateStr: string | null): string {
  if (!dateStr) return ''
  
  // Format DD/MM/YYYY ou D/M/YYYY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${year}-${month}-${day}`
  }
  
  return dateStr
}

// Formater date pour affichage
function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr) return '-'
  
  // Si déjà au format DD/MM/YYYY, retourner tel quel
  if (dateStr.includes('/')) {
    return dateStr
  }
  
  // Sinon convertir depuis ISO
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return '-'
  }
}

// Parser XML parties
function parsePartiesXml(xml: string): Partie[] {
  if (!xml || xml.includes('<erreur>')) return []

  const parties: Partie[] = []
  const partieMatches = xml.matchAll(/<partie>([\s\S]*?)<\/partie>/g)

  for (const match of partieMatches) {
    const partieXml = match[1]
    const getValue = (tag: string): string | null => {
      const m = partieXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : null
    }

    const rawDate = getValue('date')
    const isoDate = parseFrenchDate(rawDate)

    parties.push({
      date: isoDate, // ISO format pour tri
      dateFormatted: rawDate || '-', // Garder format original DD/MM/YYYY
      adversaire: getValue('advnompre') || 'Inconnu',
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

  // Trier par date décroissante
  return parties.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })
}

// Parser XML historique
function parseHistoXml(xml: string): Historique[] {
  if (!xml || xml.includes('<erreur>')) return []

  const historique: Historique[] = []
  const histoMatches = xml.matchAll(/<histo>([\s\S]*?)<\/histo>/g)

  for (const match of histoMatches) {
    const histoXml = match[1]
    const getValue = (tag: string): string | null => {
      const m = histoXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1] : null
    }

    historique.push({
      saison: getValue('saison') || '',
      phase: getValue('phase') || '',
      points: parseInt(getValue('point') || '0'),
      echelon: getValue('echelon'),
      place: getValue('place')
    })
  }

  // Trier par saison décroissante puis phase
  return historique.sort((a, b) => {
    const saisonCompare = b.saison.localeCompare(a.saison)
    if (saisonCompare !== 0) return saisonCompare
    return parseInt(b.phase) - parseInt(a.phase)
  })
}

// Calculer statistiques
function calculateStats(parties: Partie[]) {
  if (!parties.length) return null

  const victoires = parties.filter(p => p.victoire).length
  const defaites = parties.length - victoires
  const pointsGagnes = parties
    .filter(p => p.victoire)
    .reduce((sum, p) => sum + p.pointsResultat, 0)
  const pointsPerdus = parties
    .filter(p => !p.victoire)
    .reduce((sum, p) => sum + Math.abs(p.pointsResultat), 0)

  return {
    total: parties.length,
    victoires,
    defaites,
    pourcentage: Math.round((victoires / parties.length) * 100),
    pointsGagnes: Math.round(pointsGagnes * 10) / 10,
    pointsPerdus: Math.round(pointsPerdus * 10) / 10,
    bilan: Math.round((pointsGagnes - pointsPerdus) * 10) / 10
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
