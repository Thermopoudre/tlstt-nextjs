-- Migration 013: Compléter le schéma de pages_content
-- La table existait déjà (migration 005/006) avec un schéma partiel.
-- On ajoute les colonnes manquantes et on recrée la policy publique.

-- Ajouter les colonnes manquantes (idempotent)
ALTER TABLE pages_content ADD COLUMN IF NOT EXISTS meta_title VARCHAR(300);
ALTER TABLE pages_content ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE pages_content ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pages_content ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE pages_content ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Recréer la policy publique avec filtre is_published
DROP POLICY IF EXISTS pages_public_read ON pages_content;
CREATE POLICY pages_public_read ON pages_content FOR SELECT USING (is_published = true);

-- Seed des pages par défaut
INSERT INTO pages_content (slug, title, content, is_published) VALUES
  ('a-propos', 'A propos du TLSTT', '<p>Le TLSTT (Toulon La Seyne Tennis de Table) est un club de tennis de table base a La Seyne-sur-Mer.</p>', true),
  ('reglement', 'Reglement interieur', '<p>Reglement interieur du club a venir.</p>', false),
  ('politique-confidentialite', 'Politique de confidentialite', '<p>Politique de confidentialite du site TLSTT.</p>', true)
ON CONFLICT (slug) DO NOTHING;
