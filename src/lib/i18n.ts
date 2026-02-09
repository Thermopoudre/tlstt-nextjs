export type Locale = 'fr' | 'en'

export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.news': 'Actualites',
    'nav.teams': 'Equipes',
    'nav.players': 'Joueurs',
    'nav.competitions': 'Competitions',
    'nav.club': 'Club',
    'nav.contact': 'Contact',
    'nav.shop': 'Boutique',
    'nav.search': 'Rechercher...',

    // Common
    'common.loading': 'Chargement...',
    'common.back': 'Retour',
    'common.readMore': 'Lire la suite',
    'common.seeAll': 'Voir tout',
    'common.noResults': 'Aucun resultat',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',

    // Auth
    'auth.login': 'Se connecter',
    'auth.register': "S'inscrire",
    'auth.logout': 'Deconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.firstName': 'Prenom',
    'auth.lastName': 'Nom',

    // Pages
    'home.title': 'Bienvenue au TLSTT',
    'home.subtitle': 'Toulon La Seyne Tennis de Table',
    'teams.title': 'Nos Equipes',
    'players.title': 'Nos Joueurs',
    'contact.title': 'Contactez-nous',
    'gallery.title': 'Galerie Photo',
    'shop.title': 'Boutique du Club',

    // 404
    '404.title': 'Balle perdue !',
    '404.description': "La page que vous recherchez semble avoir quitte la table.",
    '404.backHome': "Retour a l'accueil",

    // Footer
    'footer.legal': 'Mentions legales',
    'footer.privacy': 'Politique de confidentialite',
    'footer.rights': 'Tous droits reserves',
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.news': 'News',
    'nav.teams': 'Teams',
    'nav.players': 'Players',
    'nav.competitions': 'Competitions',
    'nav.club': 'Club',
    'nav.contact': 'Contact',
    'nav.shop': 'Shop',
    'nav.search': 'Search...',

    // Common
    'common.loading': 'Loading...',
    'common.back': 'Back',
    'common.readMore': 'Read more',
    'common.seeAll': 'See all',
    'common.noResults': 'No results',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',

    // Auth
    'auth.login': 'Log in',
    'auth.register': 'Sign up',
    'auth.logout': 'Log out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.firstName': 'First name',
    'auth.lastName': 'Last name',

    // Pages
    'home.title': 'Welcome to TLSTT',
    'home.subtitle': 'Toulon La Seyne Table Tennis',
    'teams.title': 'Our Teams',
    'players.title': 'Our Players',
    'contact.title': 'Contact Us',
    'gallery.title': 'Photo Gallery',
    'shop.title': 'Club Shop',

    // 404
    '404.title': 'Lost ball!',
    '404.description': 'The page you are looking for seems to have left the table.',
    '404.backHome': 'Back to home',

    // Footer
    'footer.legal': 'Legal notice',
    'footer.privacy': 'Privacy policy',
    'footer.rights': 'All rights reserved',
  },
}

export function t(key: string, locale: Locale = 'fr'): string {
  return translations[locale]?.[key] || translations.fr[key] || key
}
