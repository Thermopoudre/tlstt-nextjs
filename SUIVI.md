# SUIVI DES MODIFICATIONS - TLSTT Site

## 2026-01-21 - Système Membres Complet

### Nouvelles Tables Supabase (Migration: 20260121_member_features.sql)
- `labels` - Labels FFTT de la fédération (images page accueil)
- `member_profiles` - Profils des membres (extension auth.users)
- `shop_products` - Produits de la boutique club
- `shop_orders` - Commandes boutique
- `marketplace_listings` - Annonces marketplace
- `marketplace_messages` - Messages entre membres
- `secretariat_communications` - Communications du secrétariat

### Nouveaux Fichiers

#### Authentification
- `src/lib/auth.ts` - Helpers authentification (signUp, signIn, signOut)
- `src/components/auth/AuthProvider.tsx` - Context React pour auth global
- `src/components/auth/LoginModal.tsx` - Modal de connexion
- `src/components/auth/RegisterModal.tsx` - Modal d'inscription
- `src/components/auth/UserMenu.tsx` - Menu utilisateur connecté (dropdown)

#### Pages Membres
- `src/app/espace-membre/page.tsx` - Dashboard membre
- `src/app/espace-membre/profil/page.tsx` - Gestion profil
- `src/app/espace-membre/commandes/page.tsx` - Historique commandes
- `src/app/boutique/page.tsx` - Boutique club (membres only)
- `src/app/marketplace/page.tsx` - Marketplace échange matériel

#### Composants
- `src/components/home/LabelsSection.tsx` - Section labels FFTT homepage

### Fichiers Modifiés
- `src/app/layout.tsx` - Ajout AuthProvider wrapper
- `src/components/layout/Header.tsx` - Boutons connexion/inscription + UserMenu
- `src/app/page.tsx` - Ajout section Labels en bas de page

### Fonctionnalités Implémentées

#### Système d'authentification
- Inscription membre avec email/mot de passe
- Connexion/Déconnexion
- Profil membre extensible (licence FFTT, téléphone, adresse...)
- Statut membre (pending, active, expired)
- Préférences notifications (newsletter, secrétariat)

#### Espace Membre
- Dashboard avec communications secrétariat
- Gestion profil complet
- Historique commandes
- Liens rapides boutique/marketplace

#### Boutique Club (membres only)
- Liste produits par catégorie (textile, accessoires, équipement)
- Panier avec gestion quantités
- Affichage tailles disponibles
- Gestion rupture de stock

#### Marketplace (membres only)
- Annonces vente/échange matériel
- Catégories: raquettes, revêtements, textile, chaussures, robots, tables
- États: neuf, très bon, bon, correct, usé
- Options: don gratuit, échange possible
- Création annonce via modal

#### Labels FFTT (Homepage)
- Section Labels sous les partenaires
- 3 emplacements pour images labels
- Tooltips descriptifs
- Chargement depuis Supabase

### TODO
- [ ] Appliquer migration SQL via dashboard Supabase
- [ ] Upload vraies images labels FFTT
- [ ] Configurer envoi emails (newsletter, secrétariat)
- [ ] Ajouter produits réels boutique
