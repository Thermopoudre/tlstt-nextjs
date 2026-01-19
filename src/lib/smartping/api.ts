// Classe pour interagir avec l'API SmartPing
export class SmartPingAPI {
  private appId: string
  private password: string
  private baseUrl = 'https://www.smartping.com/smartping'

  constructor() {
    this.appId = process.env.SMARTPING_APP_ID || ''
    this.password = process.env.SMARTPING_PASSWORD || ''
  }

  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const searchParams = new URLSearchParams({
      appId: this.appId,
      pwd: this.password,
      ...params
    })

    const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 3600 } // Cache 1 heure
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
    // Dans une vraie app, utiliser une lib comme fast-xml-parser
    const jsonStr = xml
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<liste>/g, '[')
      .replace(/<\/liste>/g, ']')
      .replace(/<joueur>/g, '{')
      .replace(/<\/joueur>/g, '},')
      .replace(/<(\w+)>([^<]*)<\/\1>/g, '"$1":"$2",')
      .replace(/,(\s*[}\]])/g, '$1')

    try {
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('XML Parse Error:', error)
      return []
    }
  }

  // Récupérer la liste des joueurs d'un club
  async getJoueurs(clubId: string = '08830083'): Promise<any[]> {
    return this.request('xml_liste_joueur_o.php', { club: clubId })
  }

  // Récupérer le classement d'un joueur
  async getJoueurClassement(licence: string): Promise<any> {
    return this.request('xml_joueur.php', { licence })
  }

  // Récupérer l'historique d'un joueur
  async getJoueurHistorique(licence: string): Promise<any[]> {
    return this.request('xml_histo_classement.php', { licence })
  }

  // Récupérer les équipes d'un club
  async getEquipes(clubId: string = '08830083'): Promise<any[]> {
    return this.request('xml_equipe_liste.php', { club: clubId })
  }

  // Récupérer le classement d'une poule
  async getPouleClassement(poule: string): Promise<any[]> {
    return this.request('xml_result_equ.php', { cx_poule: poule })
  }
}

// Instance singleton
export const smartPingAPI = new SmartPingAPI()
