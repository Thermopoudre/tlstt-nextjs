-- Migration 009 : Ajout de la colonne link_fftt_phase2 sur la table teams
-- Permet d'afficher un toggle Phase 1 / Phase 2 sur la page publique d'une équipe

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS link_fftt_phase2 TEXT DEFAULT NULL;

COMMENT ON COLUMN teams.link_fftt_phase2 IS
  'Paramètres FFTT pour la Phase 2 (format: D1=xxx&cx_poule=yyy). '
  'Si renseigné, un toggle Phase 1 / Phase 2 apparaît sur la page publique.';
