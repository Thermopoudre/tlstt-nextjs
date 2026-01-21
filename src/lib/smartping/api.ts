import crypto from 'crypto'

// Classe pour interagir avec l'API SmartPing / FFTT
export class SmartPingAPI {
  private appId: string
  private password: string
  private serie: string
  private baseUrl = 'http://www.fftt.com/mobile/pxml'

  constructor() {
    this.appId = process.env.SMARTPING_APP_ID || ''
    this.password = process.env.SMARTPING_PASSWORD || ''
    // Serie DOIT être fixe et initialisée une seule fois (via /api/smartping-init)
    this.serie = process.env.SMARTPING_SERIE || ''
  }

  // Générer le timestamp au format YYYYMMDDHHMMSSmmm
  private generateTimestamp(): string {
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

  // Crypter le timestamp avec HMAC-SHA1
  private encryptTimestamp(timestamp: string): string {
    // 1. MD5 du mot de passe
    const md5Key = crypto.createHash('md5').update(this.password).digest('hex')
    
    // 2. HMAC-SHA1 du timestamp avec la clé MD5
    const hmac = crypto.createHmac('sha1', md5Key)
    hmac.update(timestamp)
    return hmac.digest('hex')
  }

  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.serie) {
      throw new Error('SMARTPING_SERIE non configuré. Appelez /api/smartping-init.')
    }
    
    const tm = this.generateTimestamp()
    const tmc = this.encryptTimestamp(tm)

    const searchParams = new URLSearchParams({
      serie: this.serie,
      tm,
      tmc,
      id: this.appId,
      ...params
    })

    const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      
      // L'API SmartPing renvoie du XML, on doit le parser
      return this.parseXMLResponse(text)
    } catch (error) {
      console.error('SmartPing API Error:', error)
      throw error
    }
  }

  private parseXMLResponse(xml: string): any {
    // Parser XML simple pour les réponses SmartPing
    // Retourner le XML brut pour un parsing personnalisé
    return xml
  }

  // Récupérer la liste des joueurs d'un club (base classement)
  async getJoueurs(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_liste_joueur.php', { club: clubId })
  }

  // Récupérer la liste des licenciés d'un club (base SPID) - plus complet
  async getLicencies(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_liste_joueur_o.php', { club: clubId })
  }

  // Récupérer les licenciés avec infos classement (MEILLEUR endpoint)
  async getLicenciesComplet(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_licence_b.php', { club: clubId })
  }

  // Récupérer le détail d'un joueur (base classement)
  async getJoueurClassement(licence: string): Promise<string> {
    return this.request('xml_joueur.php', { licence })
  }

  // Récupérer le détail d'un licencié (base SPID)
  async getLicence(licence: string): Promise<string> {
    return this.request('xml_licence.php', { licence })
  }

  // Récupérer le détail d'un licencié avec classement
  async getLicenceComplet(licence: string): Promise<string> {
    return this.request('xml_licence_b.php', { licence })
  }

  // Récupérer l'historique des classements
  async getHistoriqueClassement(licence: string): Promise<string> {
    return this.request('xml_histo_classement.php', { numlic: licence })
  }

  // Récupérer les équipes d'un club
  async getEquipes(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_equipe.php', { numclu: clubId })
  }

  // Récupérer les résultats d'une poule
  async getResultatsPoule(divisionId: string, pouleId: string): Promise<string> {
    return this.request('xml_result_equ.php', { D1: divisionId, cx_poule: pouleId })
  }

  // Récupérer le classement d'une poule
  async getClassementPoule(divisionId: string, pouleId: string): Promise<string> {
    return this.request('xml_result_equ.php', { D1: divisionId, cx_poule: pouleId, action: 'classement' })
  }

  // Récupérer les parties d'un joueur (base classement mysql)
  async getPartiesJoueur(licence: string): Promise<string> {
    return this.request('xml_partie_mysql.php', { licence })
  }

  // Récupérer les parties d'un joueur (base SPID)
  async getPartiesJoueurSpid(licence: string): Promise<string> {
    return this.request('xml_partie.php', { numlic: licence })
  }

  // Récupérer les actualités FFTT
  async getActualites(): Promise<string> {
    return this.request('xml_new_actu.php', {})
  }

  // Récupérer le détail d'un club
  async getClubDetail(clubId: string = '13830083'): Promise<string> {
    return this.request('xml_club_detail.php', { club: clubId })
  }
}

// Instance singleton
export const smartPingAPI = new SmartPingAPI()
