# SUIVI DES MODIFICATIONS - TLSTT Site

## 2026-01-07 - Mise à jour Pages Joueurs & Progressions

### Fichiers Modifiés

#### Pages
- `src/app/joueurs/page.tsx` - Simplification: utilise désormais JoueursClient
- `src/app/joueurs/JoueursClient.tsx` - Refonte complète avec:
  - Statistiques détaillées (7 cartes: Licenciés, Meilleur, Moyenne, Nationaux, +2000pts, +1500pts, +1000pts)
  - Filtres par catégorie + recherche
  - Podium Top 3 avec design moderne
  - Liste complète triable (points, alphabétique)
  - Palette Noir + Bleu (#0a0a0a, #3b9fd8)
  - Breadcrumbs intégrés
- `src/app/progressions/page.tsx` - Refonte complète avec:
  - Tabs Classement / Progressions
  - Podium Top 3 identique à joueurs
  - Section "Meilleures progressions du mois"
  - Nouveaux paliers atteints (500, 1000, 1500, 2000 pts)
  - Status FFTT Live / Données locales
  - Palette Noir + Bleu cohérente

### API FFTT SmartPing

Les credentials API ont été mis à jour dans `API_FFTT.md`:
- **App ID**: SX044
- **Password**: P23GaC6gaU
- **Club ID**: 13830083
- **Expiration**: 02/11/2027

#### Configuration Vercel requise
Variables d'environnement à configurer dans Vercel Dashboard > Settings > Environment Variables:
```
SMARTPING_APP_ID=SX044
SMARTPING_PASSWORD=P23GaC6gaU
```

Puis initialiser la série en appelant:
`https://[votre-domaine]/api/smartping-init`

Le résultat donnera une variable SMARTPING_SERIE à ajouter également.

### Déploiement
- Commit: `feat(joueurs,progressions): update pages with improved stats and Noir+Bleu palette`
- Build Vercel: READY

---

## 2026-01-07 - Palette Noir + Bleu (Toutes les pages)

### Fichiers Modifiés (12 pages)
- `src/app/equipes/page.tsx`
- `src/app/galerie/page.tsx`
- `src/app/progressions/page.tsx`
- `src/app/partenaires/page.tsx`
- `src/app/boutique/page.tsx`
- `src/app/mentions-legales/page.tsx`
- `src/app/competitions/page.tsx`
- `src/app/politique-confidentialite/page.tsx`
- `src/app/politique-cookies/page.tsx`
- `src/app/espace-membre/page.tsx`
- `src/app/marketplace/page.tsx`
- `src/app/newsletter/page.tsx`

### Palette de couleurs
- Fond principal: `#0a0a0a` (noir profond)
- Cards: `#1a1a1a` avec bordure `#333`
- Accent: `#3b9fd8` (bleu vif)
- Texte: `#ffffff` (blanc)
- Hover accent: `#2d8bc9`

### API FFTT Credentials
Mise à jour de `API_FFTT.md` avec les nouveaux credentials.

---

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
