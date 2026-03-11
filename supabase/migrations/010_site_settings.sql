-- Migration 010: Table site_settings
-- Paramètres globaux du site (clé-valeur)

CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_public_read ON site_settings;
DROP POLICY IF EXISTS site_settings_admin_write ON site_settings;

CREATE POLICY site_settings_public_read ON site_settings FOR SELECT USING (true);
CREATE POLICY site_settings_admin_write ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- Seed valeurs par défaut
INSERT INTO site_settings (key, value) VALUES
  ('club_name', 'TLSTT - Toulon La Seyne Tennis de Table'),
  ('club_address', 'Gymnase Léo Lagrange, La Seyne-sur-Mer'),
  ('club_email', 'contact@tlstt.fr'),
  ('club_phone', ''),
  ('club_facebook', ''),
  ('club_description', 'Club de tennis de table basé à La Seyne-sur-Mer, dans le Var.'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
