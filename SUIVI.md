# SUIVI DES MODIFICATIONS - TLSTT Site

## 2026-02-08 - Phase 2 : Divisions correctes + Sync automatique

### Probleme
Les donnees en base Supabase avaient les mauvaises divisions Phase 2 (TLSTT 1 en Pre-Nationale au lieu de Nationale 3, TLSTT 2 en Regionale 2 au lieu de Regionale 1, etc.). Le sync-equipes utilisait encore l'API FFTT qui retourne 401.

### Divisions Phase 2 Officielles (source: PDF ligue PACA)

| Equipe | Division Phase 2 | Poule | Phase 1 | Mouvement |
|--------|-----------------|-------|---------|-----------|
| TLSTT 1 | Nationale 3 | 7 | Nationale 3 | Maintien |
| TLSTT 2 | Regionale 1 | 2 | R2 P2 (1er) | Promu R1 |
| TLSTT 3 | Regionale 3 | 2 | R2 P1 (7e) | Relegue R3 |
| TLSTT 4 | Regionale 3 | 6 | R3 P2 (6e) | Maintien |
| TLSTT 5 | Pre-Regionale | 2 | PR P1 | - |
| TLSTT 6 | Departementale 1 | 1 | PR P2 | - |
| TLSTT 7 | Departementale 1 | 2 | D1 P1 | - |
| TLSTT 8 | Departementale 2 | 1 | D2 P4 | - |
| TLSTT 9 | Departementale 3 | 4 | D2 P1 | - |
| TLSTT 10 | Departementale 3 | 6 | D3 P4 | - |
| TLSTT 11 | Departementale 3 | 1 | D3 P2 (1er) | - |
| TLSTT 12 | Departementale 4 Jeunes | 1 | D4 P2 | - |
| TLSTT 13 | Departementale 4 Jeunes | 1 | Nouvelle | - |

### Fichiers Modifies

#### `/src/app/api/sync-equipes/route.ts` (REECRIT)
- Suppression complete de l'API FFTT SmartPing (retournait 401)
- Nouveau systeme de scraping du site tennisdetableregionsud.fr
- Configuration des 13 equipes avec divisions Phase 2 officielles
- Parse automatique des classements Phase 2 quand disponibles
- Fallback: met a jour les divisions meme sans resultats

#### `/src/app/api/init-phase2/route.ts` (NOUVEAU)
- Route one-shot pour initialiser les divisions Phase 2
- Remet toutes les stats a zero (debut de phase)
- Source: PDF officiel ligue PACA 2526_equipes_paca_ph2.pdf

#### `/src/app/equipes/page.tsx`
- Toutes les references Phase 1 changees en Phase 2
- Ajout Nationale 3 et Regionale 1 dans getDivisionShort
- Texte d'info mis a jour (mise a jour automatique)

#### `vercel.json`
- Cron jobs: sync-equipes samedi 21h + dimanche 21h

### Etat Phase 2
- Phase 2 Journee 1 : 7-8 fevrier 2026 (ce week-end)
- Pas encore de resultats en ligne (normal)
- Le cron sync-equipes recuperera les resultats automatiquement
- Le site regional charge les Phase 2 dynamiquement (JS)

### TODO
- [x] Corriger les divisions Phase 2 dans Supabase
- [x] Reecrire sync-equipes avec scraping (sans API FFTT)
- [x] Mettre a jour la page equipes pour Phase 2
- [x] Ajouter crons Vercel pour sync automatique
- [ ] Verifier le scraping quand Phase 2 resultats apparaissent (semaine prochaine)
- [ ] Upload vraies images labels FFTT
- [ ] Configurer les variables SMTP dans Vercel

---


## 2026-02-07 - Page Equipes Operationnelle (Solution Alternative)

### Probleme
L'API FFTT SmartPing (`xml_equipe.php`) ne fonctionne pas avec les credentials actuels (retourne "Compte incorrect"). Tous les endpoints non-joueurs sont bloques.

### Solution Alternative Implementee
Scraping du site officiel TLSTT (`url.tennistabletls.com`) et de la feuille Google Sheets "Resultats Championnat" pour recuperer :
- La liste des 13 equipes inscrites en Phase 2 2025/2026
- Les resultats de la Phase 1 (4 journees jouees)
- Les classements par poule

### Donnees Inserees dans Supabase (table `teams`)

| Equipe | Division Phase 2 | Poule | Phase 1 | V | N | D | Cla |
|--------|-----------------|-------|---------|---|---|---|-----|
| TLSTT 1 | Pre-Nationale | - | Nationale 3 | 1 | 1 | 2 | 6e |
| TLSTT 2 | Regionale 2 | 1 | R2 Poule 2 | 4 | 0 | 0 | 1er |
| TLSTT 3 | Regionale 2 | 2 | R2 Poule 1 | 0 | 1 | 3 | 7e |
| TLSTT 4 | Regionale 3 | 5 | R3 Poule 2 | 1 | 1 | 2 | 6e |
| TLSTT 5 | Pre-Regionale | 2 | PR Poule 1 | 2 | 0 | 2 | 3e |
| TLSTT 6 | Departementale 1 | 1 | PR Poule 2 | 1 | 1 | 2 | 6e |
| TLSTT 7 | Departementale 1 | 2 | D1 Poule 1 | 1 | 1 | 2 | 4e |
| TLSTT 8 | Departementale 2 | 1 | D2 Poule 4 | 1 | 2 | 0 | 4e |
| TLSTT 9 | Departementale 3 | 4 | D2 Poule 1 | 1 | 0 | 3 | 7e |
| TLSTT 10 | Departementale 3 | 6 | D3 Poule 4 | 1 | 1 | 2 | 6e |
| TLSTT 11 | Departementale 3 | 1 | D3 Poule 2 | 4 | 0 | 0 | 1er |
| TLSTT 12 | Departementale 4 Jeunes | 1 | D4 Poule 2 | 2 | 0 | 2 | 4e |
| TLSTT 13 | Departementale 4 Jeunes | 1 | Nouvelle | - | - | - | - |

### Fichiers Modifies

#### `/src/app/api/equipes/route.ts`
- Suppression complete des appels FFTT API (xml_equipe.php, xml_initialisation.php, xml_result_equ.php)
- Lecture directe depuis la table Supabase `teams`
- Tri par niveau de division (Pre-Nationale > Regionale > Departementale)
- Code simplifie de 326 lignes a 80 lignes

#### `/src/app/equipes/page.tsx`
- Refonte complete de l'interface
- Badges colores par niveau de division (rouge=national, orange=regional, bleu/vert=departemental)
- Statistiques globales (13 equipes, matchs joues, victoires, nuls, defaites)
- Barre de progression V/N/D globale avec pourcentage
- Filtres par division
- Classement avec badge (or/argent/bronze pour top 3)
- Taux de victoire par equipe
- Info sur la Phase 1 d'origine (avant promotions/relegations)

### Sources de Donnees
- **Site officiel TLSTT**: `url.tennistabletls.com/tt-equipes/equipes-inscrites` (calendrier Phase 2)
- **Google Sheets**: `docs.google.com/spreadsheets/d/1G0avLWu4dRoKpSwGN89S4vxMRCs0ugW37nGuDH9ziBc` (resultats Phase 1)

### Etat des Pages (mis a jour)
- **Joueurs** : FONCTIONNEL - 225 joueurs avec points exacts
- **Progressions** : FONCTIONNEL - Donnees corrigees
- **Player detail** : FONCTIONNEL - Points exacts, parties, historique
- **Equipes** : FONCTIONNEL - 13 equipes avec resultats Phase 1, divisions Phase 2

### TODO
- [ ] Ajouter resultats Phase 2 au fur et a mesure des journees
- [ ] Upload vraies images labels FFTT
- [ ] Configurer envoi emails (newsletter, secretariat)
- [ ] Ajouter produits reels boutique

---

## 2026-02-04 - Correction Points Exacts via xml_joueur.php

### Solution Implémentée ✅
Après analyse du code PHP fonctionnel, utilisation de `xml_joueur.php` pour récupérer les points exacts mensuels de chaque joueur.

### Endpoints Fonctionnels Identifiés
- `xml_liste_joueur.php` - **FONCTIONNE** (liste joueurs avec `clast`)
- `xml_joueur.php` - **FONCTIONNE** (détails joueur avec points exacts: `point`, `apoint`, `valinit`)
- `xml_partie_mysql.php` - **FONCTIONNE** (parties d'un joueur)
- `xml_histo_classement.php` - **FONCTIONNE** (historique classements)
- `xml_equipe.php` - **À TESTER** (peut nécessiter permissions spéciales)

### Résultats de la Synchronisation (04/02/2026)
- **221 joueurs** synchronisés avec succès
- **221 points exacts** récupérés via `xml_joueur.php`
- **Top 10 avec points réels** :
  - Davide SIMON: 2243 pts (N506)
  - Brice BOURGEOIS: 2003 pts
  - Cedric CEUNINCK: 1847 pts
  - Nicolas DELARUE: 1835 pts
  - Stephane MESSI: 1597 pts
  - Yohan OUELLET: 1507 pts

### Fichiers Modifiés

#### `/src/app/api/sync-joueurs/route.ts`
- Récupère d'abord la liste via `xml_liste_joueur.php`
- Pour chaque joueur, appelle `xml_joueur.php` pour obtenir les points exacts
- Champs extraits: `point` (mensuel), `apoint` (ancien), `valinit` (initial)
- Fallback vers `clast * 100` si détail non disponible
- Met à jour `fftt_points_exact`, `fftt_points_ancien`, `fftt_points_initial` dans Supabase
- Correction du bug "Classe NaN" pour les catégories

#### `/src/app/api/progressions/route.ts`
- Utilise maintenant `xml_joueur.php` au lieu de `xml_licence_b.php`
- Enrichit les top 30 joueurs avec données live FFTT
- Calcul progressions mensuelle et saisonnière

#### `/src/app/api/player/[licence]/route.ts`
- Appels API restructurés: `xml_joueur.php` en priorité
- `xml_licence_b.php` en fallback optionnel (peut échouer)
- Parsing amélioré avec fallbacks pour tous les champs

#### `/src/app/api/test-equipes/route.ts` (nouveau)
- Endpoint de test pour diagnostiquer `xml_equipe.php`

### État des Pages

#### Page Joueurs `/joueurs` ✅
- **Fonctionnelle** avec points exacts
- Affiche 221 joueurs avec vrais points mensuels (1847, 2003, 1597, etc.)
- Top 3, statistiques, filtres opérationnels

#### Page Progressions `/progressions` ✅
- **Fonctionnelle** avec données réelles
- Affiche les vraies progressions mensuelles et saisonnières
- Stats: 39 en progression, 36 en régression, 146 stables

#### Page Équipes `/equipes` ❌
- **Non fonctionnelle** - endpoint `xml_equipe.php` retourne "Compte incorrect"
- Les credentials FFTT actuels n'ont pas accès à cet endpoint
- **Solution**: Contacter la FFTT pour obtenir des permissions étendues ou un nouveau compte API

### Endpoints FFTT - Bilan des Accès

| Endpoint | Statut | Usage |
|----------|--------|-------|
| `xml_initialisation.php` | ✅ | Initialisation série |
| `xml_liste_joueur.php` | ✅ | Liste des joueurs du club |
| `xml_joueur.php` | ✅ | **Points exacts** par joueur |
| `xml_partie_mysql.php` | ✅ | Parties jouées |
| `xml_histo_classement.php` | ✅ | Historique classement |
| `xml_equipe.php` | ❌ | Équipes du club |
| `xml_licence_b.php` | ❌ | Licence détaillée |
| `xml_liste_joueur_o.php` | ❌ | Liste SPID |

---

## 2026-02-02 - Synchronisation FFTT et Corrections API

### Problème Initial Identifié
Certains endpoints FFTT retournaient "Compte incorrect":
- `xml_licence_b.php` - ⚠️ Peut ne pas fonctionner
- `xml_liste_joueur_o.php` - ⚠️ Peut ne pas fonctionner
- `xml_equipe.php` - ⚠️ À tester

### Solution Alternative Trouvée (02/04)
Utilisation de `xml_joueur.php` qui fonctionne parfaitement avec les credentials actuels.

### Fichiers Créés/Modifiés

#### Routes API
- `src/app/api/sync-joueurs/route.ts` - Synchronisation joueurs depuis FFTT
  - Utilise `xml_liste_joueur.php` (seul endpoint accessible)
  - Convertit `clast` en points approximatifs
  - Met à jour 221 joueurs dans Supabase
- `src/app/api/equipes/route.ts` - API équipes (nécessite credentials élevés)
- `src/app/api/progressions/route.ts` - API progressions mise à jour
- `src/app/api/smartping-debug/route.ts` - Diagnostic API
- `src/app/api/smartping-test/route.ts` - Test de connexion
- `src/app/api/test-licence/route.ts` - Test licence individuelle
- `src/app/api/test-joueur/route.ts` - Test multi-endpoints

#### Base de données Supabase
Nouvelles colonnes ajoutées à la table `players`:
- `fftt_points_ancien` (INTEGER) - Points du mois précédent
- `fftt_points_initial` (INTEGER) - Points de début de saison
- `fftt_category` (VARCHAR) - Catégorie FFTT

### État des Pages

#### Page Joueurs `/joueurs` ✅
- Fonctionne correctement
- Affiche 221 joueurs avec points approximatifs
- Top 3, statistiques, filtres opérationnels
- Points basés sur `clast` (1800, 1600, 1500, etc.)

#### Page Progressions `/progressions` ✅
- Fonctionne correctement
- Affiche classement et progressions
- Progressions limitées (données approximatives)

#### Page Équipes `/equipes` ⚠️
- Affiche "Aucune équipe trouvée"
- Nécessite credentials FFTT avec permissions étendues
- L'endpoint `xml_equipe.php` retourne "Compte incorrect"

### Action Requise
Pour obtenir les points exacts et les données équipes, il faut:
1. Contacter la FFTT pour obtenir des credentials avec permissions étendues
2. Ou re-générer une nouvelle `SMARTPING_SERIE` via l'interface FFTT

### Commits
- `fix(api): update sync-joueurs, equipes and progressions routes for exact points`
- `feat(api): add test-licence endpoint for FFTT debugging`
- `feat(api): add test-joueur endpoint to explore FFTT endpoints`
- `fix(api): use clast-based points approximation since xml_licence_b is not accessible`

---

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

## 2026-02-06 - Corrections Sync + Equipes + Progressions

### Diagnostic API FFTT
Tests exhaustifs des endpoints FFTT SmartPing. Resultats confirmes :
- `xml_liste_joueur.php` - **FONCTIONNE** (liste 225 joueurs)
- `xml_joueur.php` - **FONCTIONNE** (details + points exacts, apoint, valinit)
- `xml_equipe.php` - **NE FONCTIONNE PAS** (Compte incorrect)
- `xml_epreuve.php` - **NE FONCTIONNE PAS** (Compte incorrect)
- `xml_club_b.php` - **NE FONCTIONNE PAS** (Compte incorrect)
- `xml_initialisation.php` - **NE FONCTIONNE PAS** (Compte incorrect)
- `xml_club_dep2.php` - **NE FONCTIONNE PAS** (Compte incorrect)

Conclusion : Les credentials FFTT ne donnent acces qu'aux endpoints joueurs. Tous les endpoints equipes/club/competition retournent "Compte incorrect".

### Corrections effectuees

#### 1. Sync Joueurs (`/api/sync-joueurs`)
- Ajout extraction de `valinit` (valeur initiale de saison) depuis xml_joueur.php
- Correction des faux defaults 500 pour `fftt_points_ancien` et `fftt_points_initial`
- Quand l'API ne retourne pas `apoint`/`valinit`, les points actuels sont utilises (pas de fausse progression)
- 225 joueurs synchronises avec points exacts

#### 2. Equipes - Table Supabase + Fallback API
- Creation table `teams` dans Supabase (migration)
- `/api/equipes` lit depuis Supabase en priorite, tente FFTT API en arriere-plan
- Si FFTT API fonctionne un jour, les donnees sont automatiquement sauvegardees dans Supabase
- Page frontend amelioree avec stats V/N/D, barre de progression, classement poule

#### 3. Progressions - Filtrage fausses progressions
- Detection des valeurs par defaut erronees (500 avec points actuels > 600)
- Quand anciens/initiaux points sont 500 et actuels beaucoup plus hauts, traiter comme "pas de donnees"
- Stats corrigees : 18 en progression, 27 en regression, 180 stables (au lieu de 100+ fausses progressions)

#### 4. Correction SQL directe
- UPDATE players SET fftt_points_ancien = fftt_points, fftt_points_initial = fftt_points WHERE fftt_points_ancien = 500 AND fftt_points > 600

### Fichiers modifies
- `src/app/api/sync-joueurs/route.ts` - Extraction valinit, correction defaults 500
- `src/app/api/progressions/route.ts` - Filtrage fausses progressions
- `src/app/api/equipes/route.ts` - Lecture Supabase + fallback FFTT API
- `src/app/equipes/page.tsx` - UI amelioree avec stats detaillees

### Fichiers supprimes (debug)
- `src/app/api/test-epreuve/route.ts`
- `src/app/api/debug-compare/route.ts`

### Etat des pages
- **Joueurs** : FONCTIONNEL - 225 joueurs avec points exacts, podium, recherche, tri
- **Progressions** : FONCTIONNEL - Donnees corrigees, vraies progressions seulement
- **Player detail** : FONCTIONNEL - Points exacts, parties, historique
- **Equipes** : EN ATTENTE - Table Supabase prete, donnees manquantes (API FFTT non disponible)

### TODO
- [ ] Obtenir credentials FFTT avec acces complet (equipes, epreuves, clubs)
- [x] Saisir manuellement les equipes du club dans Supabase (fait, 13 equipes)
- [ ] Upload vraies images labels FFTT (admin page creee)
- [x] Configurer envoi emails - Gmail SMTP integre (nodemailer)
- [x] Ajouter produits boutique (15 produits inseres)
- [x] Integration HelloAsso (cotisation + boutique, configurable en admin)

## 2026-02-07 - Audit Complet et Corrections Majeures

### Problemes identifies et corriges

#### 1. Admin Equipes - PLACEHOLDER remplace par vraie BDD
- **Avant** : Page admin avec 4 fausses equipes hardcodees
- **Apres** : CRUD complet connecte a la table Supabase `teams` (13 equipes reelles)
- **Fichier** : `src/app/admin/equipes/page.tsx` - Reecrit entierement

#### 2. Systeme de roles membre/visiteur
- **Avant** : Pas de distinction entre membre du club et visiteur simple
- **Apres** : 
  - Migration SQL : ajout colonnes `role` (visitor/member/admin) et `is_validated` dans `member_profiles`
  - Formulaire inscription : choix "Membre du club" vs "Visiteur"
  - Membres du club doivent fournir licence FFTT et etre valides par le secretariat
  - **Fichiers** : `AuthProvider.tsx`, `RegisterModal.tsx`

#### 3. Controle d'acces boutique + marketplace
- **Avant** : Boutique accessible a tout utilisateur connecte
- **Apres** : Boutique et Marketplace reservees aux membres valides (`role=member + is_validated=true` ou `role=admin`)
- Les visiteurs simples voient un message "Validation en attente"
- **Fichiers** : `boutique/page.tsx`, `marketplace/page.tsx`

#### 4. Admin Gestion des membres (NOUVEAU)
- Page `/admin/membres` pour valider les inscriptions
- Visualisation : total inscrits, membres valides, en attente, visiteurs
- Actions : Valider, Refuser, Promouvoir admin
- Filtrage par statut (tous, en attente, valides, visiteurs)
- Badge notification dans le sidebar admin

#### 5. Admin Labels FFTT (NOUVEAU)
- Page `/admin/labels` avec CRUD complet
- Ajouter/modifier/supprimer des labels
- Toggle actif/inactif
- URL image configurable
- **Fichier** : `src/app/admin/labels/page.tsx`

#### 6. Gmail SMTP pour envoi emails
- Utilitaire `src/lib/email.ts` avec nodemailer
- Configuration via variables d'environnement Vercel (SMTP_HOST, SMTP_USER, SMTP_PASS, etc.)
- Emails automatiques : notification contact, bienvenue membre
- Page admin `/admin/email` avec guide de configuration et test
- Route API `/api/email/test` (GET: test connexion, POST: email test)
- Route `/api/contact` mise a jour pour envoyer notification email

#### 7. Integration HelloAsso
- Page admin `/admin/helloasso` pour configurer les URLs HelloAsso
- Settings Supabase : `helloasso_cotisation_url`, `helloasso_boutique_url`, `helloasso_org_slug`
- Page Boutique : section cotisation HelloAsso + bouton "Payer avec HelloAsso" dans le panier
- Guide de configuration dans l'admin
- **Fichiers** : `admin/helloasso/page.tsx`, `boutique/page.tsx`

#### 8. Admin Boutique - Page creation produit (NOUVEAU)
- Page `/admin/boutique/nouveau` pour creer des produits
- Formulaire complet : nom, description, prix, stock, tailles, image, categorie
- **Fichier** : `src/app/admin/boutique/nouveau/page.tsx`

#### 9. Homepage - Stats dynamiques
- "Equipes" maintenant dynamique depuis table `teams` (au lieu de hardcode "12")
- **Fichier** : `src/app/page.tsx`

#### 10. Navigation - Lien Boutique pour membres
- Le lien "Boutique" apparait dans le header quand un utilisateur est connecte
- **Fichier** : `src/components/layout/Header.tsx`

#### 11. 10 produits supplementaires ajoutes en BDD
- Total : 15 produits (textile, accessoires, equipement)
- Produits : Polo competition, Veste coupe-vent, Casquette, Gourde, Housses de raquette, Balles 3 etoiles, Sweat capuche, Bracelet, Porte-cles

### Sidebar admin mis a jour
- Ajout : Membres, Labels FFTT, Config Email, HelloAsso
- **Fichier** : `src/components/admin/AdminSidebar.tsx`

### Matrice Front/Back-Office (apres corrections)

| Page Front | Admin Back | Statut CRUD |
|-----------|-----------|-------------|
| Accueil | /admin/accueil | OK - Update |
| Actualites | /admin/actualites | OK - Full CRUD |
| Carousel | /admin/carousel | OK - Full CRUD |
| Equipes | /admin/equipes | OK - Full CRUD (corrige) |
| Joueurs | /admin/joueurs | Lecture seule |
| Galerie | /admin/galerie | OK - Full CRUD |
| Planning | /admin/planning | OK - Full CRUD |
| Partenaires | /admin/partenaires | OK - Full CRUD |
| Contact | /admin/contact + /admin/messages | OK |
| Newsletter | /admin/newsletter | OK - Lecture + Export |
| Boutique | /admin/boutique | OK - Full CRUD (corrige) |
| Marketplace | /admin/marketplace | OK - Moderation |
| Labels | /admin/labels | OK - Full CRUD (nouveau) |
| Membres | /admin/membres | OK - Validation (nouveau) |
| Email | /admin/email | OK - Config + Test (nouveau) |
| HelloAsso | /admin/helloasso | OK - Config (nouveau) |
| Mentions legales | /admin/pages/mentions-legales | OK |
| Confidentialite | /admin/pages/confidentialite | OK |
| Cookies | /admin/pages/cookies | OK |
| Parametres | /admin/parametres | OK |

---

## 2026-02-07 - Check-up Complet Back-Office + Corrections UX

### Audit Back-Office complet
Analyse systematique de chaque page admin : C/R/U/D, bugs, UX, liens casses.

### Corrections critiques appliquees

#### 1. Admin Partenaires - CRUD complet (REFONTE)
- Converti de Server Component a Client Component
- Ajout CRUD complet inline avec modale (Create, Edit, Delete)
- Toggle actif/inactif en 1 clic
- Logo affiche dans la liste
- Corrige: champ `position` (pas `display_order`) aligné avec la DB
- **Fichier** : `src/app/admin/partenaires/page.tsx`

#### 2. Admin Planning - CRUD complet (REFONTE)
- Converti de Server Component a Client Component
- Ajout Create, Edit, Delete via modale
- Toggle actif/inactif en 1 clic
- Formulaire : jour, horaires, type, niveau, description
- **Fichier** : `src/app/admin/planning/page.tsx`

#### 3. Admin Actualites - Filtres + Delete (REFONTE)
- Converti de Server Component a Client Component
- Filtres fonctionnels par categorie et statut
- Bouton Delete fonctionnel avec confirmation
- Toggle statut publie/brouillon en 1 clic
- **Fichier** : `src/app/admin/actualites/page.tsx`

#### 4. Admin Boutique - Edit + Delete (FIX)
- Corrige: champ `is_active` (pas `active`) aligne avec DB
- Ajout modale d'edition inline
- Ajout bouton Delete avec confirmation
- Affichage tailles et badges stock/rupture
- **Fichier** : `src/app/admin/boutique/page.tsx`

#### 5. Admin Competitions - CRUD complet avec table Supabase (REFONTE)
- Ancien code utilisait API FFTT qui ne fonctionnait pas → nouveau code Supabase
- Table `competitions` creee en DB avec 7 matchs exemples
- CRUD complet via modale (date, heure, equipe, adversaire, lieu, score, statut)
- Saisie rapide du score via bouton "Marquer termine"
- Couleurs victoire/defaite/nul
- **Fichier** : `src/app/admin/competitions/page.tsx`
- **Migration** : `create_competitions_table`

#### 6. Admin Commandes - Detail modal (FIX)
- Bouton "Voir details" maintenant fonctionnel
- Modale avec infos client, articles, total, changement de statut
- **Fichier** : `src/app/admin/commandes/page.tsx`

#### 7. Loading states ajoutees
- Pages Accueil et Parametres admin : spinner de chargement
- **Fichiers** : `admin/(protected)/accueil/page.tsx`, `admin/(protected)/parametres/page.tsx`

#### 8. Table `site_settings` creee
- Pour stocker les settings des pages admin (accueil, parametres, club, contact)
- **Migration** : `create_site_settings_table`

### Corrections Front-Office critiques

#### 9. BUG FIX: Actualites page vide (CRITIQUE)
- `.eq('published', true)` → `.eq('status', 'published')`
- La colonne `published` n'existe pas, la colonne correcte est `status`
- **Fichier** : `src/app/actualites/[category]/page.tsx`

#### 10. BUG FIX: Galerie page vide (CRITIQUE)
- Meme bug que actualites: `.eq('published', true)` → `.eq('status', 'published')`
- **Fichier** : `src/app/galerie/page.tsx`

#### 11. BUG FIX: Partenaires front-office lien casse
- `partner.website` → `partner.website_url` (nom de colonne correct)
- **Fichier** : `src/app/partenaires/page.tsx`

#### 12. Competitions front-office (REFONTE)
- Ancien code : fetch API FFTT instable
- Nouveau code : Server Component fetching Supabase `competitions` table
- Stats victoires/defaites/nuls
- Design coherent dark theme
- **Fichier** : `src/app/competitions/page.tsx`

#### 13. Page /club redirect (FIX 404)
- Le hero homepage liait vers `/club` qui n'existait pas → 404
- Page redirect creee vers `/club/a-propos`
- **Fichier** : `src/app/club/page.tsx`

#### 14. UX: Actualites dark theme
- Page actualites front-office harmonisee avec le theme dark du site
- Couleurs `#0f3057` + `#5bc0de` → `#0a0a0a` + `#3b9fd8`
- **Fichier** : `src/app/actualites/[category]/page.tsx`

#### 15. Fix params Next.js 16
- `params: { category: string }` → `params: Promise<{ category: string }>`
- **Fichier** : `src/app/actualites/[category]/page.tsx`

### Matrice Admin Back-Office mise a jour (apres corrections)

| Page Admin | Table | C | R | U | D | Statut |
|-----------|-------|---|---|---|---|--------|
| Accueil | site_settings | - | OK | OK | - | OK + loading |
| Parametres | site_settings | - | OK | OK | - | OK + loading |
| Actualites | news | OK | OK | OK | OK | REFAIT |
| Carousel | carousel_slides | OK | OK | OK | OK | OK |
| Galerie | albums/photos | OK | OK | OK | OK | OK |
| Equipes | teams | OK | OK | OK | OK | OK |
| Competitions | competitions | OK | OK | OK | OK | REFAIT |
| Planning | trainings | OK | OK | OK | OK | REFAIT |
| Partenaires | partners | OK | OK | OK | OK | REFAIT |
| Boutique | shop_products | OK | OK | OK | OK | FIX |
| Commandes | shop_orders | - | OK | OK | - | FIX |
| Messages | contact_messages | - | OK | OK | - | OK |
| Newsletter | newsletters | - | OK | - | - | OK |
| Membres | member_profiles | - | OK | OK | - | OK |
| Labels | labels | OK | OK | OK | OK | OK |
| HelloAsso | settings | - | OK | OK | - | OK |
| Email | - | - | - | - | - | OK (config) |
| Marketplace | marketplace_listings | - | OK | OK | - | OK |

### TODO Restant
- [ ] Upload vraies images labels FFTT
- [ ] Configurer les variables SMTP dans Vercel
- [ ] Creer les campagnes HelloAsso et configurer les URLs
- [ ] Ajouter resultats Phase 2 au fur et a mesure
- [ ] Page admin joueurs : ajouter edition

---

### [2026-02-08] - Corrections API FFTT Equipes + Diagnostic permissions

**Corrections :**
- Fix club number `08830142` → `13830083` dans `api/equipes/tlstt/route.ts` et `api/competitions/route.ts`
- Reecriture complete `equipes/[id]/page.tsx` : lecture D1/cx_poule depuis Supabase, fallback xml_equipe
- Reecriture `api/sync-equipes/route.ts` : API FFTT au lieu du scraping externe
- Ajout methodes SmartPingAPI : `getOrganismes`, `getEpreuves`, `getDivisions`, `request_public`
- Ajout `api/discover-equipes/route.ts` pour decouverte D1/cx_poule
- Ajout cron jobs dans `vercel.json` (sync sam/dim 21:00 UTC)

**Limitation decouverte :** Les credentials SX044 n'ont acces qu'aux endpoints joueurs (xml_liste_joueur, xml_joueur). Les endpoints equipes/competitions (xml_equipe, xml_organisme, xml_epreuve, xml_division) retournent 401 "Compte incorrect".

**Action requise :** Contacter la FFTT pour etendre les permissions du compte SX044.

---

### [2026-02-08] - Batch ameliorations site (10 points)

**1. SMTP (config Vercel)**
- Variables necessaires : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_ADMIN_EMAIL`
- A configurer manuellement dans Vercel Dashboard > Settings > Environment Variables
- Le code (`src/lib/email.ts`) est deja pret a les utiliser

**2. SEO og:image**
- Fichier : `src/app/layout.tsx` - ajout `openGraph.images` et `twitter.card`
- Image : `public/og-image.png` (1200x630px, branding TLSTT)
- Partages reseaux sociaux afficheront desormais une image du club

**3. Fix images actualites**
- Bug corrige dans `src/components/NewsCard.tsx` : `photo_url` → `image_url`
- Les images stockees en base (colonne `image_url`) s'affichent maintenant correctement
- News sans image : fallback Unsplash par categorie fonctionne

**4. Admin BO**
- Migration `fix_admins_table_and_add_admin` : colonne `password_hash` rendue nullable
- Admin insere : `contact@thermopoudre.fr` / role `superadmin`
- **ACTION REQUISE** : creer le compte Supabase Auth correspondant dans le Dashboard Supabase
  - Aller dans Authentication > Users > Add User
  - Email : `contact@thermopoudre.fr` + mot de passe au choix
  - Confirmer l'email immediatement

**5. Trainings / Planning**
- 21 creneaux deja en base (du lundi au samedi)
- Page `/planning` affiche correctement les creneaux actifs
- 2 creneaux Toulon marques inactifs (a configurer)

**7. Nettoyage endpoints debug**
- Supprimes (9 fichiers) :
  - `api/smartping-debug/route.ts`
  - `api/test-equipes/route.ts`
  - `api/debug-fftt/route.ts`
  - `api/smartping-test/route.ts`
  - `api/test-joueur/route.ts`
  - `api/test-licence/route.ts`
  - `api/smartping-init/route.ts`
  - `api/init-phase2/route.ts`
  - `api/smartping-status/route.ts`
- Plus aucun endpoint de debug accessible en production

**8. Planning interactif**
- Deja complet avec 21 creneaux, legende, infos pratiques, tarifs, CTA inscription
- Admin BO planning fonctionnel (CRUD creneaux)

**9. HelloAsso**
- Page admin deja implementee : `admin/helloasso/page.tsx`
- Configuration par URL (pas d'API keys necessaires)
- **ACTION REQUISE** : renseigner les URLs des campagnes HelloAsso dans le BO

**10. Tables vides**
- `paca_clubs`, `players_history`, `member_profiles`, `page_versions`, `site_settings`, `shop_orders`, `marketplace_listings`, `marketplace_messages`, `contact_messages`, `secretariat_communications`
- Conservees pour features futures (espaces membres, marketplace, etc.)
- Pas de nettoyage necessaire

**Commit :** `0997e0c` - chore: cleanup debug endpoints, add SEO og:image, fix NewsCard image field
