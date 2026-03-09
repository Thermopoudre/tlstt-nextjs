-- =============================================================================
-- MIGRATION 006: Toutes les tables manquantes (consolidation 005a + 005b)
-- À appliquer via Supabase Dashboard > SQL Editor
-- =============================================================================

-- ============================================================
-- 1. TABLE: alerts (bandeau d'alerte global)
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  link_url TEXT,
  link_label VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active, starts_at, ends_at);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_public_read" ON alerts
  FOR SELECT
  USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
  );

CREATE POLICY "alerts_admin_all" ON alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- 2. TABLE: news_likes (likes articles)
-- ============================================================
CREATE TABLE IF NOT EXISTS news_likes (
  id BIGSERIAL PRIMARY KEY,
  news_id BIGINT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(news_id, user_id),
  UNIQUE(news_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_news_likes_news_id ON news_likes(news_id);

ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_likes_public_read" ON news_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "news_likes_insert_auth" ON news_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (user_id IS NULL AND ip_hash IS NOT NULL)
  );

CREATE POLICY "news_likes_delete_own" ON news_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. TABLE: tarif_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS tarif_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tarif_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read tarif_categories" ON tarif_categories FOR SELECT USING (true);
CREATE POLICY "auth all tarif_categories" ON tarif_categories FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. TABLE: tarifs
-- ============================================================
CREATE TABLE IF NOT EXISTS tarifs (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES tarif_categories(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  price NUMERIC(8,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tarifs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read tarifs" ON tarifs FOR SELECT USING (is_active = true);
CREATE POLICY "auth all tarifs" ON tarifs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. TABLE: faq_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS faq_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read faq_categories" ON faq_categories FOR SELECT USING (true);
CREATE POLICY "auth all faq_categories" ON faq_categories FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. TABLE: faq
-- ============================================================
CREATE TABLE IF NOT EXISTS faq (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES faq_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read faq" ON faq FOR SELECT USING (is_active = true);
CREATE POLICY "auth all faq" ON faq FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. TABLE: palmares
-- ============================================================
CREATE TABLE IF NOT EXISTS palmares (
  id SERIAL PRIMARY KEY,
  year INT NOT NULL,
  competition TEXT NOT NULL,
  result TEXT NOT NULL,
  category TEXT,
  players TEXT,
  notes TEXT,
  medal_type TEXT CHECK (medal_type IN ('or', 'argent', 'bronze', 'participation')),
  is_active BOOLEAN DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE palmares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read palmares" ON palmares FOR SELECT USING (is_active = true);
CREATE POLICY "auth all palmares" ON palmares FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- DONNÉES PAR DÉFAUT
-- ============================================================

INSERT INTO tarif_categories (name, position) VALUES
  ('Adultes', 1),
  ('Jeunes', 2),
  ('Loisir / Découverte', 3)
ON CONFLICT DO NOTHING;

INSERT INTO tarifs (category_id, label, price, description, position) VALUES
  (1, 'Adulte (18-64 ans)', 220.00, 'Licence FFTT + cotisation club incluses', 1),
  (1, 'Senior (65 ans et +)', 180.00, 'Licence FFTT + cotisation club incluses', 2),
  (2, 'Junior (15-17 ans)', 160.00, 'Licence FFTT + cotisation club incluses', 3),
  (2, 'Cadet / Benjamin (moins de 15 ans)', 130.00, 'Licence FFTT + cotisation club incluses', 4),
  (3, 'Loisir adulte (sans licence)', 120.00, 'Accès aux créneaux loisir uniquement', 5),
  (3, 'Découverte (1 mois)', 30.00, 'Pour essayer avant de s''inscrire', 6)
ON CONFLICT DO NOTHING;

INSERT INTO faq_categories (name, position) VALUES
  ('Inscription & Adhésion', 1),
  ('Entraînements', 2),
  ('Compétitions', 3),
  ('Équipement', 4)
ON CONFLICT DO NOTHING;

INSERT INTO faq (category_id, question, answer, position) VALUES
  (1, 'Comment s''inscrire au club ?', 'Vous pouvez nous contacter via le formulaire de contact ou venir directement lors d''une séance d''entraînement. La première séance d''essai est gratuite !', 1),
  (1, 'Quelle est la période d''inscription ?', 'Les inscriptions sont ouvertes de septembre à fin octobre, mais nous acceptons les nouvelles adhésions en cours d''année selon les places disponibles.', 2),
  (1, 'Quels documents fournir pour l''inscription ?', 'Un certificat médical de non contre-indication à la pratique du tennis de table (ou un questionnaire de santé QS-SPORT), une photo d''identité et le règlement de la cotisation.', 3),
  (2, 'Quels sont les horaires d''entraînement ?', 'Consultez notre page Planning pour voir tous les créneaux disponibles. Nous proposons des séances pour tous les niveaux, du loisir à la compétition.', 1),
  (2, 'Faut-il avoir un niveau minimum pour participer ?', 'Non ! Nous accueillons tous les niveaux, des débutants complets aux joueurs confirmés. Des séances spécifiques sont organisées par niveau.', 2),
  (3, 'Comment participer aux compétitions ?', 'Pour participer aux compétitions officielles FFTT, vous devez avoir une licence fédérale. Parlez à votre entraîneur qui vous guidera dans votre inscription.', 1),
  (4, 'Doit-on apporter sa propre raquette ?', 'Pour les séances d''essai, le matériel de base est fourni. Pour une pratique régulière, il est conseillé d''avoir sa propre raquette. Nos entraîneurs peuvent vous conseiller.', 1)
ON CONFLICT DO NOTHING;

INSERT INTO palmares (year, competition, result, category, medal_type, position) VALUES
  (2023, 'Championnat Régional PACA par équipes', 'Champion de Division 2', 'Équipe 1', 'or', 1),
  (2022, 'Championnat Départemental Var', 'Finaliste', 'Équipe 2', 'argent', 2),
  (2022, 'Open de Toulon', '3ème place', 'Individuel', 'bronze', 3),
  (2021, 'Championnat Régional PACA', 'Champion de Division 3', 'Équipe 2', 'or', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Alerte de bienvenue (exemple)
-- ============================================================
INSERT INTO alerts (message, type, is_active) VALUES
  ('Bienvenue sur le site du TLSTT ! Consultez notre planning pour les prochains entraînements.', 'info', false)
ON CONFLICT DO NOTHING;
