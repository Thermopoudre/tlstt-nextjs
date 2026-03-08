# MÉTHODE DE TRAVAIL - TLSTT Site

## À chaque demande

### 1. Consultation des documents
- Lire PLAN.md pour comprendre le contexte et les fonctionnalités
- Lire METHODETRAVAIL.md pour les procédures
- Lire SUIVI.md pour l'historique des modifications

### 2. Analyse de la demande
- Identifier les fichiers concernés
- Vérifier les dépendances
- Planifier les modifications

### 3. Implémentation
- Modifier les fichiers un par un
- Tester les changements (browser si possible)
- Vérifier les lints

### 4. Mise à jour documentation
- Mettre à jour SUIVI.md avec les modifications
- Mettre à jour PLAN.md si nouvelles fonctionnalités

### 5. Déploiement
- Commit avec message Conventional Commits
- Push sur GitHub
- Vérifier déploiement Vercel

## Conventions

### Commits
Format: `type(scope): description`
- feat: nouvelle fonctionnalité
- fix: correction bug
- refactor: refactoring code
- docs: documentation
- style: formatage
- chore: maintenance

### Code
- TypeScript strict
- Composants React fonctionnels
- Hooks pour la logique
- Tailwind pour le styling
- Pas d'emojis sauf demande explicite

### Base de données
- Migrations SQL dans /supabase/migrations
- RLS activé sur toutes les tables
- UUID pour les IDs

### Structure fichiers
```
src/
  app/           # Pages (App Router)
  components/    # Composants réutilisables
    auth/        # Authentification
    layout/      # Header, Footer
    home/        # Composants page accueil
    player/      # Composants joueurs
  lib/           # Utilitaires
    supabase/    # Client Supabase
public/
  images/        # Images statiques
supabase/
  migrations/    # Migrations SQL
```

## Tests

### Checklist debugging formulaires
- [ ] Vérifier le HTML du formulaire
- [ ] Vérifier le bouton submit
- [ ] Vérifier les attributs name
- [ ] Tester avec script debug
- [ ] Vérifier les redirections
- [ ] Vider le cache Smarty/Next
- [ ] Consulter les logs
