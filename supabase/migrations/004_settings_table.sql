-- Table key-value pour les paramètres système (SMTP, etc.)
-- Utilisée par lib/email.ts et api/settings/smtp/route.ts

CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour accès rapide par clé
CREATE INDEX IF NOT EXISTS settings_key_idx ON settings (setting_key);

-- RLS : lecture publique (nécessaire pour lib/email.ts côté serveur)
-- Écriture réservée aux admins via API route
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politique lecture : uniquement les utilisateurs authentifiés (SMTP sensible)
CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (auth.role() IN ('service_role', 'authenticated'));

-- Politique écriture : uniquement service_role
CREATE POLICY "settings_insert" ON settings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "settings_update" ON settings
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "settings_delete" ON settings
  FOR DELETE USING (auth.role() = 'service_role');

-- Valeurs SMTP par défaut (vides)
INSERT INTO settings (setting_key, setting_value) VALUES
  ('smtp_host', ''),
  ('smtp_port', '587'),
  ('smtp_secure', 'false'),
  ('smtp_user', ''),
  ('smtp_pass', ''),
  ('smtp_from', ''),
  ('smtp_admin_email', '')
ON CONFLICT (setting_key) DO NOTHING;
