-- Migration 012: Table labels
-- Étiquettes / badges pour les articles et contenus

CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(20) DEFAULT '#3b9fd8',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS labels_public_read ON labels;
DROP POLICY IF EXISTS labels_admin_all ON labels;

CREATE POLICY labels_public_read ON labels FOR SELECT USING (true);
CREATE POLICY labels_admin_all ON labels FOR ALL USING (auth.role() = 'authenticated');
