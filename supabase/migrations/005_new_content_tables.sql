-- Migration 005: Tables tarifs, faq, palmares

-- ============================================================
-- TABLE: tarif_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS tarif_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: tarifs
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

-- ============================================================
-- TABLE: faq_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS faq_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: faq
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

-- ============================================================
-- TABLE: palmares
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS Policies (public read)
-- ============================================================
ALTER TABLE tarif_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE palmares ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public read tarif_categories" ON tarif_categories FOR SELECT USING (true);
CREATE POLICY "public read tarifs" ON tarifs FOR SELECT USING (is_active = true);
CREATE POLICY "public read faq_categories" ON faq_categories FOR SELECT USING (true);
CREATE POLICY "public read faq" ON faq FOR SELECT USING (is_active = true);
CREATE POLICY "public read palmares" ON palmares FOR SELECT USING (is_active = true);

-- Authenticated full access
CREATE POLICY "auth all tarif_categories" ON tarif_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth all tarifs" ON tarifs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth all faq_categories" ON faq_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth all faq" ON faq FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth all palmares" ON palmares FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Catégories tarifs
INSERT INTO tarif_categories (name, position) VALUES
  ('Adultes', 1),
  ('Jeunes', 2),
  ('Loisir / Découverte', 3)
ON CONFLICT DO NOTHING;

-- Tarifs exemples
INSERT INTO tarifs (category_id, label, price, description, position) VALUES
  (1, 'Adulte (18-64 ans)', 220.00, 'Licence FFTT + cotisation club incluses', 1),
  (1, 'Senior (65 ans et +)', 180.00, 'Licence FFTT + cotisation club incluses', 2),
  (2, 'Junior (15-17 ans)', 160.00, 'Licence FFTT + cotisation club incluses', 3),
  (2, 'Cadet / Benjamin (moins de 15 ans)', 130.00, 'Licence FFTT + cotisation club incluses', 4),
  (3, 'Loisir adulte (sans licence)', 120.00, 'Accès aux créneaux loisir uniquement', 5),
  (3, 'Découverte (1 mois)', 30.00, 'Pour essayer avant de s''inscrire', 6)
ON CONFLICT DO NOTHING;

-- Catégories FAQ
INSERT INTO faq_categories (name, position) VALUES
  ('Inscription & Adhésion', 1),
  ('Entraînements', 2),
  ('Compétitions', 3),
  ('Équipement', 4)
ON CONFLICT DO NOTHING;

-- FAQ exemples
INSERT INTO faq (category_id, question, answer, position) VALUES
  (1, 'Comment s''inscrire au club ?', 'Vous pouvez nous contacter via le formulaire de contact ou venir directement lors d''une séance d''entraînement. La première séance d''essai est gratuite !', 1),
  (1, 'Quelle est la période d''inscription ?', 'Les inscriptions sont ouvertes de septembre à fin octobre, mais nous acceptons les nouvelles adhésions en cours d''année selon les places disponibles.', 2),
  (1, 'Quels documents fournir pour l''inscription ?', 'Un certificat médical de non contre-indication à la pratique du tennis de table (ou un questionnaire de santé QS-SPORT), une photo d''identité et le règlement de la cotisation.', 3),
  (2, 'Quels sont les horaires d''entraînement ?', 'Consultez notre page Planning pour voir tous les créneaux disponibles. Nous proposons des séances pour tous les niveaux, du loisir à la compétition.', 1),
  (2, 'Faut-il avoir un niveau minimum pour participer ?', 'Non ! Nous accueillons tous les niveaux, des débutants complets aux joueurs confirmés. Des séances spécifiques sont organisées par niveau.', 2),
  (3, 'Comment participer aux compétitions ?', 'Pour participer aux compétitions officielles FFTT, vous devez avoir une licence fédérale. Parlez à votre entraîneur qui vous guidera dans votre inscription.', 1),
  (4, 'Doit-on apporter sa propre raquette ?', 'Pour les séances d''essai, le matériel de base est fourni. Pour une pratique régulière, il est conseillé d''avoir sa propre raquette. Nos entraîneurs peuvent vous conseiller.', 1)
ON CONFLICT DO NOTHING;

-- Palmares exemples
INSERT INTO palmares (year, competition, result, category, medal_type, position) VALUES
  (2023, 'Championnat Régional PACA par équipes', 'Champion de Division 2', 'Équipe 1', 'or', 1),
  (2022, 'Championnat Départemental Var', 'Finaliste', 'Équipe 2', 'argent', 2),
  (2022, 'Open de Toulon', '3ème place', 'Individuel', 'bronze', 3),
  (2021, 'Championnat Régional PACA', 'Champion de Division 3', 'Équipe 2', 'or', 4)
ON CONFLICT DO NOTHING;
