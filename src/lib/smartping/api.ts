import crypto from 'crypto'

// Génère une série conforme à la spec SmartPing 2.0 : 15 caractères [A-Z][0-9]
function generateLocalSerie(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  const bytes = crypto.randomBytes(15)
  for (let i = 0; i < 15; i++) {
    s += chars[bytes[i] % chars.length]
  }
  return s
}

// Classe pour interagir avec l'API SmartPing / FFTT
export class SmartPingAPI {
  private appId: string
  private password: string
  private serie: string
  private initialized = false
  private baseUrl = 'https://www.fftt.com/mobile/pxml'

  constructor() {
    this.appId = process.env.SMARTPING_APP_ID || ''
    this.password = process.env.SMARTPING_PASSWORD || ''
    // Série issue de l'env si définie, sinon générée localement (initialisée via xml_initialisation.php)
    this.serie = process.env.SMARTPING_SERIE || generateLocalSerie()
  }

  // Timestamp officiel SmartPing 2.0 : année(4)+mois(2)+jour(2)+heure(2)+min(2)+sec(2)+millièmes(3)
  // => YYYYMMDDHHMMSSmmm (17 caractères). Conforme au vecteur de test FFTT.
  private generateTimestamp(): string {
    const now = new Date()
    const p = (n: number, len = 2) => n.toString().padStart(len, '0')
    return (
      now.getFullYear().toString() +
      p(now.getMonth() + 1) +
      p(now.getDate()) +
      p(now.getHours()) +
      p(now.getMinutes()) +
      p(now.getSeconds()) +
      p(now.getMilliseconds(), 3)
    )
  }

  // Cryptage : HMAC-SHA1(tm, MD5(motdepasse)) en hexa minuscule
  private encryptTimestamp(timestamp: string): string {
    const md5Key = crypto.createHash('md5').update(this.password).digest('hex')
    const hmac = crypto.createHmac('sha1', md5Key)
    hmac.update(timestamp)
    return hmac.digest('hex')
  }

  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const tm = this.generateTimestamp()
    const tmc = this.encryptTimestamp(tm)
    const searchParams = new URLSearchParams({
      serie: this.serie,
      tm,
      tmc,
      id: this.appId,
      ...params,
    })
    return `${this.baseUrl}/${endpoint}?${searchParams.toString()}`
  }

  // Initialise la série via xml_initialisation.php (1 fois par cold-start), conforme à la spec.
  private async ensureInitialized(force = false): Promise<void> {
    if (force) this.serie = generateLocalSerie()
    this.initialized = true
    // xml_initialisation.php n'est pas requis pour ce compte : les scripts autorisés
    // répondent directement. On évite donc un appel réseau inutile.
  }

  // Méthode publique pour les appels API directs
  async request_public(endpoint: string, params: Record<string, string> = {}): Promise<string> {
    return this.request(endpoint, params)
  }

  private async request(endpoint: string, params: Record<string, string> = {}): Promise<string> {
    await this.ensureInitialized()

    const doFetch = async (): Promise<Response> =>
      fetch(this.buildUrl(endpoint, params), { method: 'GET', cache: 'no-store' })

    try {
      let response = await doFetch()
      // Série rejetée/expirée — réinitialiser et réessayer une fois
      if (response.status === 401) {
        await this.ensureInitialized(true)
        response = await doFetch()
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // Le contenu est en UTF-8 (malgré l'en-tête XML qui annonce ISO-8859-1) : décodage UTF-8
      return await response.text()
    } catch (error) {
      // 401 attendus sur endpoints non activés par la FFTT pour ce compte -> warn, fallback Supabase côté routes
      console.warn('SmartPing API:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  async getJoueurs(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_liste_joueur.php', { club: clubId })
  }
  async getLicencies(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_liste_joueur_o.php', { club: clubId })
  }
  async getLicenciesComplet(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_licence_b.php', { club: clubId })
  }
  async getJoueurClassement(licence: string): Promise<string> {
    return this.request('xml_joueur.php', { licence })
  }
  async getLicence(licence: string): Promise<string> {
    return this.request('xml_licence.php', { licence })
  }
  async getLicenceComplet(licence: string): Promise<string> {
    return this.request('xml_licence_b.php', { licence })
  }
  async getHistoriqueClassement(licence: string): Promise<string> {
    return this.request('xml_histo_classement.php', { numlic: licence })
  }
  // type : M (France masc.), F (France fém.), A (toutes France), '' (toutes les autres équipes)
  async getEquipes(clubId: string = '13830083', type: string = 'A'): Promise<string> {
    const params: Record<string, string> = { numclu: clubId }
    if (type) params.type = type
    return this.request('xml_equipe.php', params)
  }
  async getOrganismes(type: string = 'D', pere?: string): Promise<string> {
    const params: Record<string, string> = { type }
    if (pere) params.pere = pere
    return this.request('xml_organisme.php', params)
  }
  async getEpreuves(organisme: string, type: string = 'E'): Promise<string> {
    return this.request('xml_epreuve.php', { organisme, type })
  }
  async getDivisions(organisme: string, epreuve: string, type: string = 'E'): Promise<string> {
    return this.request('xml_division.php', { organisme, epreuve, type })
  }
  async getResultatsPoule(divisionId: string, pouleId: string): Promise<string> {
    return this.request('xml_result_equ.php', { action: '', auto: '1', D1: divisionId, cx_poule: pouleId })
  }
  async getClassementPoule(divisionId: string, pouleId: string): Promise<string> {
    return this.request('xml_result_equ.php', { action: 'classement', auto: '1', D1: divisionId, cx_poule: pouleId })
  }
  async getPartiesJoueur(licence: string): Promise<string> {
    return this.request('xml_partie_mysql.php', { licence })
  }
  async getPartiesJoueurSpid(licence: string): Promise<string> {
    return this.request('xml_partie.php', { numlic: licence })
  }
  async getActualites(): Promise<string> {
    return this.request('xml_new_actu.php', {})
  }
  async getClubDetail(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_club_detail.php', { club: clubId })
  }
}

// Instance singleton
export const smartPingAPI = new SmartPingAPI()
