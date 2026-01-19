# 📋 PHASE 2 - PLAN DE MIGRATION COMPLET

## 🎯 OBJECTIF
Migrer **toutes** les fonctionnalités du site PHP vers Next.js + Supabase

---

## ✅ DÉJÀ FAIT (Phase 1)

1. ✅ Infrastructure (Supabase + Vercel + GitHub)
2. ✅ Header + Footer responsive
3. ✅ Page d'accueil basique
4. ✅ Pages actualités (ping/club/handi) avec liste + détail
5. ✅ Page joueurs (liste basique)
6. ✅ Page joueur détail (fiche + historique + graphique)
7. ✅ Page contact (formulaire + API)
8. ✅ API SmartPing (classe wrapper)

---

## 🔥 À FAIRE (Phase 2)

### 🏗️ PRIORITÉ 1 : BACK-OFFICE ADMIN (Critique)

#### 1. Authentification Admin
- [ ] Page login `/admin/login`
- [ ] Système d'auth avec Supabase Auth
- [ ] Protection des routes admin
- [ ] Session persistante

#### 2. Dashboard Admin
- [ ] Page dashboard `/admin`
- [ ] Statistiques du site
- [ ] Dernières activités
- [ ] Widgets

#### 3. Gestion Actualités
- [ ] Liste articles `/admin/actualites`
- [ ] Créer article `/admin/actualites/nouveau`
- [ ] Éditer article `/admin/actualites/[id]/edit`
- [ ] Upload images
- [ ] Éditeur WYSIWYG (TinyMCE ou Tiptap)
- [ ] Prévisualisation

#### 4. Gestion Galerie
- [ ] Liste albums `/admin/galerie`
- [ ] Upload photos
- [ ] Organiser par albums
- [ ] Gestion métadonnées

#### 5. Gestion Planning
- [ ] CRUD créneaux d'entraînement
- [ ] Catégories (jeunes, dirigé, libre, etc.)
- [ ] Horaires dynamiques

#### 6. Gestion Joueurs/Équipes
- [ ] Sync manuelle SmartPing
- [ ] Édition infos joueurs
- [ ] Gestion équipes

#### 7. Paramètres Site
- [ ] Réseaux sociaux
- [ ] Informations club
- [ ] Tarifs

---

### 📄 PRIORITÉ 2 : PAGES FRONT-OFFICE

#### 1. Page Planning
- [ ] `/planning`
- [ ] Tableau dynamique des entraînements
- [ ] Code couleur par type
- [ ] Légende
- [ ] 3 cartes infos (lieu, tarifs, pratique)

#### 2. Page Équipes
- [ ] `/equipes`
- [ ] Liste des équipes TLSTT
- [ ] Classement des poules
- [ ] Résultats matchs
- [ ] API SmartPing

#### 3. Page Galerie
- [ ] `/galerie`
- [ ] Albums photos
- [ ] Lightbox
- [ ] Filtres par catégorie

#### 4. Page Newsletter
- [ ] `/newsletter`
- [ ] Archives newsletters
- [ ] Formulaire abonnement
- [ ] Envoi via API email

#### 5. Pages Club
- [ ] `/club/a-propos`
- [ ] `/club/stages`
- [ ] `/club/challenge`
- [ ] `/club/inscription`
- [ ] Contenu éditable depuis admin

#### 6. Page Partenaires
- [ ] `/partenaires`
- [ ] Logo + lien sponsors
- [ ] Éditable depuis admin

---

### 🎨 PRIORITÉ 3 : AMÉLIORATIONS

#### 1. Page Accueil
- [ ] Hero section avec image
- [ ] Stats en temps réel
- [ ] Carrousel actualités
- [ ] Widget derniers résultats
- [ ] Prochains matchs

#### 2. Flux RSS
- [ ] Intégration flux RSS Ping
- [ ] Intégration flux RSS Handisport
- [ ] Affichage dans pages actualités

#### 3. Espace Membre
- [ ] Connexion joueur
- [ ] Profil personnel
- [ ] Historique perso

#### 4. Boutique HelloAsso
- [ ] Intégration widget
- [ ] Page dédiée

---

## 📊 ESTIMATION TEMPS

| Tâche | Temps |
|-------|-------|
| Back-office Auth | 1h |
| Dashboard Admin | 1h |
| Gestion Actualités | 2h |
| Gestion Galerie | 1h30 |
| Gestion Planning | 1h |
| Pages Club | 2h |
| Page Planning | 1h |
| Page Équipes | 2h |
| Page Galerie | 1h30 |
| Page Newsletter | 1h |
| Partenaires | 30min |
| Flux RSS | 1h |
| Améliorations Accueil | 1h30 |
| **TOTAL** | **~17h** |

---

## 🎯 ORDRE D'EXÉCUTION

1. **Back-office Auth** → Critique pour tout le reste
2. **Dashboard Admin** → Vue d'ensemble
3. **Gestion Actualités** → Contenu principal
4. **Page Planning** → Demandé par user
5. **Page Équipes** → Données sportives
6. **Gestion Galerie + Page Galerie** → Visuel
7. **Pages Club** → Contenu statique
8. **Newsletter** → Communication
9. **Partenaires** → Sponsors
10. **Flux RSS** → Automatisation
11. **Améliorations Accueil** → Polish final

---

## 📝 NOTES IMPORTANTES

- ✅ Utiliser Supabase pour tout le stockage
- ✅ Protéger toutes les routes admin avec middleware
- ✅ Upload images sur Supabase Storage
- ✅ Design cohérent avec couleurs TLSTT
- ✅ Responsive mobile-first
- ✅ Commit réguliers sur GitHub
- ✅ Déploiement auto sur Vercel

---

**Début de la Phase 2** : Maintenant !
