-- =============================================================================
-- MIGRATION 008: Table stages (stages tennis de table TLSTT)
-- À appliquer via Supabase Dashboard > SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS stages (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'vacances',  -- vacances, perfectionnement, jeunes, handisport
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lieu VARCHAR(255),
  capacite INTEGER DEFAULT 20,
  inscrits INTEGER DEFAULT 0,
  age_min INTEGER,
  age_max INTEGER,
  prix DECIMAL(10,2),
  animateur VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stages_type ON stages(type);
CREATE INDEX IF NOT EXISTS idx_stages_active ON stages(is_active);
CREATE INDEX IF NOT EXISTS idx_stages_date ON stages(date_debut);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les stages publiés
CREATE POLICY "stages_public_read" ON stages
  FOR SELECT USING (is_published = TRUE AND is_active = TRUE);

-- Écriture admin uniquement
CREATE POLICY "stages_admin_all" ON stages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
