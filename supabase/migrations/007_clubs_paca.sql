-- =============================================================================
-- MIGRATION 007: Table clubs_paca (annuaire clubs PACA tennis de table)
-- À appliquer via Supabase Dashboard > SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS clubs_paca (
  id BIGSERIAL PRIMARY KEY,
  numero VARCHAR(50) UNIQUE,                  -- Numéro FFTT
  nom VARCHAR(255) NOT NULL,
  ville VARCHAR(255),
  code_postal VARCHAR(10),
  departement VARCHAR(10),                    -- 04, 05, 06, 13, 83, 84
  nom_salle VARCHAR(255),
  adresse_salle TEXT,
  code_postal_salle VARCHAR(10),
  ville_salle VARCHAR(255),
  telephone VARCHAR(50),
  email VARCHAR(255),
  nom_contact VARCHAR(255),
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubs_paca_departement ON clubs_paca(departement);
CREATE INDEX IF NOT EXISTS idx_clubs_paca_active ON clubs_paca(is_active);
CREATE INDEX IF NOT EXISTS idx_clubs_paca_nom ON clubs_paca(nom);

ALTER TABLE clubs_paca ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous
CREATE POLICY "clubs_paca_public_read" ON clubs_paca
  FOR SELECT USING (is_active = TRUE);

-- Écriture admin uniquement (service_role via admin client)
CREATE POLICY "clubs_paca_admin_all" ON clubs_paca
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- Données de seed : quelques clubs PACA pour initialiser
-- (à compléter via /admin ou import CSV)
-- =============================================================================
INSERT INTO clubs_paca (numero, nom, ville, code_postal, departement, telephone, email) VALUES
  ('08830146', 'TT LA SEYNE SUR MER', 'La Seyne-sur-Mer', '83500', '83', NULL, NULL),
  ('08830001', 'TOULON TENNIS DE TABLE', 'Toulon', '83000', '83', NULL, NULL),
  ('08130001', 'MARSEILLE TT', 'Marseille', '13001', '13', NULL, NULL),
  ('08060001', 'NICE TT', 'Nice', '06000', '06', NULL, NULL),
  ('08130200', 'AIX EN PROVENCE TT', 'Aix-en-Provence', '13100', '13', NULL, NULL),
  ('08830050', 'HYERES TT', 'Hyères', '83400', '83', NULL, NULL)
ON CONFLICT (numero) DO NOTHING;
