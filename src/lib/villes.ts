/**
 * Référencement local : les communes du secteur pour lesquelles le club veut
 * apparaître dans les recherches « club / cours de tennis de table à … ».
 *
 * Chaque commune a sa propre page (/tennis-de-table/<slug>) avec un contenu
 * réellement différent : salle la plus proche, temps de trajet, accès,
 * questions fréquentes. Pas de page « coquille vide » : Google les pénalise.
 */

export type Salle = {
  id: 'lery' | 'valfleuri'
  nom: string
  adresse: string
  codePostal: string
  ville: string
  acces: string
  /** mot-clé présent dans trainings.description pour retrouver les créneaux */
  motCle: string
}

export const SALLES: Record<Salle['id'], Salle> = {
  lery: {
    id: 'lery',
    nom: 'Complexe sportif Léry',
    adresse: "42 boulevard de l'Europe",
    codePostal: '83500',
    ville: 'La Seyne-sur-Mer',
    acces: 'Parking gratuit sur place, accès par le boulevard de l’Europe. Salle accessible aux personnes à mobilité réduite.',
    motCle: 'Léry',
  },
  valfleuri: {
    id: 'valfleuri',
    nom: 'Gymnase de l’école Val Fleuri',
    adresse: 'Place Lieutenant Roger Lauret',
    codePostal: '83000',
    ville: 'Toulon',
    acces: 'Quartier Val Fleuri, ouest de Toulon. Stationnement dans les rues adjacentes.',
    motCle: 'Val Fleuri',
  },
}

export type Ville = {
  slug: string
  nom: string
  /** « à Toulon », « à La Seyne-sur-Mer »… */
  prep: string
  codePostal: string
  salle: Salle['id']
  /** temps de trajet indicatif jusqu’à la salle de référence */
  trajet: string
  /** ce qui distingue cette commune, rédigé pour un habitant */
  intro: string
  quartiers: string[]
  voisines: string[]
  faq: { question: string; answer: string }[]
}

export const VILLES: Ville[] = [
  {
    slug: 'toulon',
    nom: 'Toulon',
    prep: 'à Toulon',
    codePostal: '83000',
    salle: 'valfleuri',
    trajet: 'Le gymnase Val Fleuri est dans Toulon même, à l’ouest de la ville : 10 minutes depuis le centre, 15 depuis le Mourillon.',
    intro:
      'Le TLSTT est le club de tennis de table de Toulon et de La Seyne-sur-Mer, affilié à la Fédération Française de Tennis de Table (FFTT). Fort de plus de 230 licenciés et de 13 équipes engagées en championnat, c’est l’un des clubs les plus actifs du Var. Les Toulonnais s’entraînent au gymnase de l’école Val Fleuri, avec des créneaux loisirs adultes en journée, et retrouvent l’ensemble du club au complexe Léry de La Seyne pour les entraînements dirigés, les jeunes et la compétition.',
    quartiers: ['Val Fleuri', 'Le Jonquet', 'Saint-Roch', 'Pont-du-Las', 'Bon-Rencontre', 'La Rode', 'Mourillon', 'Centre-ville'],
    voisines: ['la-seyne-sur-mer', 'ollioules', 'six-fours-les-plages'],
    faq: [
      { question: 'Où jouer au tennis de table à Toulon ?', answer: 'Le TLSTT propose des créneaux au gymnase de l’école Val Fleuri (place Lieutenant Roger Lauret, Toulon ouest) et au complexe Léry de La Seyne-sur-Mer, à 10 minutes en voiture. Le planning complet est en ligne sur la page Planning.' },
      { question: 'Peut-on essayer avant de s’inscrire ?', answer: 'Oui. La première séance d’essai est gratuite, à tout âge et à tout niveau. Venez avec des chaussures de sport propres ; une raquette peut vous être prêtée.' },
      { question: 'À partir de quel âge un enfant peut-il commencer ?', answer: 'Dès 5 ans avec la formule Débutants 5-10 ans (une séance par semaine). Les jeunes compétiteurs rejoignent ensuite les groupes encadrés par l’entraîneur du club.' },
      { question: 'Combien coûte la licence ?', answer: 'Les tarifs de la saison sont détaillés sur la page Tarifs : licence loisirs adultes, licence jeunes et compétiteurs, formule découverte enfants. Le Pass’Sport est accepté.' },
    ],
  },
  {
    slug: 'la-seyne-sur-mer',
    nom: 'La Seyne-sur-Mer',
    prep: 'à La Seyne-sur-Mer',
    codePostal: '83500',
    salle: 'lery',
    trajet: 'Le complexe Léry est au cœur de La Seyne, boulevard de l’Europe : 5 minutes depuis le centre-ville, 10 depuis Les Sablettes ou Mar Vivo.',
    intro:
      'Le complexe sportif Léry, à La Seyne-sur-Mer, est la salle principale du TLSTT : c’est ici que s’entraînent les jeunes, les groupes élite et les équipes engagées en championnat, et que se jouent les rencontres à domicile. Club historique de la ville, né en 1954 et associé à Toulon depuis 2003, le TLSTT accueille les Seynois de 5 à 80 ans, du loisir du lundi soir au critérium fédéral.',
    quartiers: ['Centre-ville', 'Les Sablettes', 'Mar Vivo', 'Tamaris', 'Berthe', 'Les Mouissèques', 'Janas', 'Fabrégas'],
    voisines: ['toulon', 'six-fours-les-plages', 'saint-mandrier-sur-mer'],
    faq: [
      { question: 'Où se trouve la salle de tennis de table de La Seyne-sur-Mer ?', answer: 'Au complexe sportif Léry, 42 boulevard de l’Europe, 83500 La Seyne-sur-Mer. Parking gratuit sur place.' },
      { question: 'Quels sont les horaires d’entraînement à La Seyne ?', answer: 'Des créneaux tous les jours de la semaine : loisirs adultes et handisport en soirée, jeunes en fin d’après-midi, entraînements dirigés pour les compétiteurs. Le détail est sur la page Planning.' },
      { question: 'Le club accueille-t-il les joueurs en situation de handicap ?', answer: 'Oui. Le TLSTT est engagé en handisport : des créneaux « Loisir / Handi » sont ouverts chaque semaine au complexe Léry, salle accessible.' },
      { question: 'Comment s’inscrire ?', answer: 'Venez à une séance d’essai gratuite, puis inscrivez-vous en ligne depuis la page Rejoindre ou directement à la salle auprès d’un membre du bureau.' },
    ],
  },
  {
    slug: 'six-fours-les-plages',
    nom: 'Six-Fours-les-Plages',
    prep: 'à Six-Fours-les-Plages',
    codePostal: '83140',
    salle: 'lery',
    trajet: 'Depuis Six-Fours, le complexe Léry de La Seyne est à 10 minutes en voiture par la RD 63 (route de La Seyne), un peu plus depuis Le Brusc ou les Lônes.',
    intro:
      'Vous habitez Six-Fours-les-Plages et cherchez un club de tennis de table ? Le TLSTT, club de Toulon et de La Seyne-sur-Mer affilié à la FFTT, est le club de référence de l’ouest toulonnais. Sa salle principale, le complexe Léry, est à dix minutes de Six-Fours. De nombreux licenciés viennent déjà de Six-Fours, du Brusc, de Reynier ou des Playes pour s’entraîner et jouer en championnat.',
    quartiers: ['Centre', 'Le Brusc', 'Les Lônes', 'Reynier', 'Les Playes', 'La Coudoulière', 'Portissol'],
    voisines: ['la-seyne-sur-mer', 'sanary-sur-mer', 'ollioules'],
    faq: [
      { question: 'Y a-t-il un club de tennis de table à Six-Fours-les-Plages ?', answer: 'Le club le plus proche est le TLSTT (Toulon La Seyne Tennis de Table), dont la salle principale, le complexe Léry à La Seyne-sur-Mer, est à environ 10 minutes de Six-Fours en voiture.' },
      { question: 'Mon enfant de Six-Fours peut-il s’inscrire ?', answer: 'Bien sûr : le club accueille les jeunes dès 5 ans, quelle que soit leur commune de résidence. Créneaux jeunes en fin d’après-midi au complexe Léry.' },
      { question: 'Y a-t-il des créneaux le soir pour les adultes ?', answer: 'Oui, plusieurs soirs par semaine en formule loisir (libre accès) ou entraînement dirigé. Première séance gratuite.' },
    ],
  },
  {
    slug: 'ollioules',
    nom: 'Ollioules',
    prep: 'à Ollioules',
    codePostal: '83190',
    salle: 'valfleuri',
    trajet: 'Ollioules est à 10 minutes du gymnase Val Fleuri (Toulon ouest) comme du complexe Léry (La Seyne) : les deux salles du club sont accessibles.',
    intro:
      'Entre Toulon et La Seyne, les Ollioulais ont le choix : le gymnase Val Fleuri, à l’ouest de Toulon, pour les créneaux loisirs adultes de journée, et le complexe Léry de La Seyne pour les jeunes, l’entraînement dirigé et la compétition. Le TLSTT, affilié FFTT, compte plus de 230 licenciés et 13 équipes : il y a toujours un groupe de votre niveau.',
    quartiers: ['Centre', 'La Gare', 'Les Gorges', 'Faveyrolles', 'La Bonnefont'],
    voisines: ['toulon', 'la-seyne-sur-mer', 'sanary-sur-mer'],
    faq: [
      { question: 'Quelle salle choisir depuis Ollioules ?', answer: 'Les deux sont à environ 10 minutes. Val Fleuri (Toulon) pour les créneaux loisirs de journée, Léry (La Seyne) pour les jeunes, les entraînements dirigés et les matchs.' },
      { question: 'Faut-il un certificat médical ?', answer: 'Pour une licence compétition, un certificat médical ou le questionnaire de santé selon votre situation est demandé par la FFTT. Pour le loisir, le club vous indique la marche à suivre lors de l’inscription.' },
    ],
  },
  {
    slug: 'sanary-sur-mer',
    nom: 'Sanary-sur-Mer',
    prep: 'à Sanary-sur-Mer',
    codePostal: '83110',
    salle: 'lery',
    trajet: 'Depuis Sanary, comptez 15 minutes jusqu’au complexe Léry de La Seyne par Six-Fours, ou par l’autoroute A50 sortie La Seyne.',
    intro:
      'Pour les Sanaryens, le club de tennis de table le plus complet du secteur est le TLSTT à La Seyne-sur-Mer : école de jeunes labellisée par la FFTT, groupes loisirs adultes, handisport et 13 équipes en championnat. Quinze minutes de route pour un club structuré, avec un entraîneur diplômé et des créneaux tous les jours de la semaine.',
    quartiers: ['Centre', 'Portissol', 'La Gorguette', 'Beaucours', 'Saint-Côme'],
    voisines: ['six-fours-les-plages', 'la-seyne-sur-mer', 'ollioules'],
    faq: [
      { question: 'Le trajet Sanary – La Seyne vaut-il le coup pour un enfant ?', answer: 'Les familles de Sanary qui viennent au club le font pour l’encadrement : école de jeunes labellisée, entraîneur diplômé, équipes jeunes en championnat. Les créneaux jeunes sont regroupés en fin d’après-midi pour limiter les allers-retours.' },
      { question: 'Peut-on covoiturer ?', answer: 'Plusieurs familles du secteur Sanary / Six-Fours s’organisent entre elles. Parlez-en au club lors de votre séance d’essai.' },
    ],
  },
  {
    slug: 'saint-mandrier-sur-mer',
    nom: 'Saint-Mandrier-sur-Mer',
    prep: 'à Saint-Mandrier-sur-Mer',
    codePostal: '83430',
    salle: 'lery',
    trajet: 'Depuis la presqu’île, le complexe Léry est à 15 minutes par la corniche de Tamaris et les Sablettes.',
    intro:
      'Depuis Saint-Mandrier, le TLSTT est le club de tennis de table naturel : sa salle principale, au complexe Léry de La Seyne-sur-Mer, est à un quart d’heure par la corniche. Club FFTT de plus de 230 licenciés, il accueille débutants, loisirs, jeunes et compétiteurs, ainsi que les joueurs en situation de handicap.',
    quartiers: ['Le Village', 'Pin Rolland', 'Le Creux Saint-Georges', 'La Coudoulière'],
    voisines: ['la-seyne-sur-mer', 'toulon'],
    faq: [
      { question: 'Quel est le club de ping-pong le plus proche de Saint-Mandrier ?', answer: 'Le TLSTT, au complexe Léry de La Seyne-sur-Mer, à environ 15 minutes de route.' },
      { question: 'Y a-t-il des créneaux adaptés aux débutants adultes ?', answer: 'Oui : les créneaux loisirs adultes accueillent tous les niveaux, avec matériel prêté au début. Première séance gratuite.' },
    ],
  },
]

export function trouverVille(slug: string): Ville | undefined {
  return VILLES.find(v => v.slug === slug)
}
