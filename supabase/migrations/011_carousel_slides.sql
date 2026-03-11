-- Migration 011: Table carousel_slides
-- Slides du carousel de la page d'accueil

CREATE TABLE IF NOT EXISTS carousel_slides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS carousel_public_read ON carousel_slides;
DROP POLICY IF EXISTS carousel_admin_all ON carousel_slides;

CREATE POLICY carousel_public_read ON carousel_slides FOR SELECT USING (is_active = true);
CREATE POLICY carousel_admin_all ON carousel_slides FOR ALL USING (auth.role() = 'authenticated');
