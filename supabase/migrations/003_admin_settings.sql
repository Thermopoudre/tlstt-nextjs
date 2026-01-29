-- Tables pour le back-office admin

-- Table des paramètres du site
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  page VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table du contenu des pages
CREATE TABLE IF NOT EXISTS pages_content (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des produits boutique
CREATE TABLE IF NOT EXISTS shop_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS shop_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  items JSONB DEFAULT '[]',
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des annonces marketplace
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  type VARCHAR(50) DEFAULT 'vente',
  condition VARCHAR(100),
  category VARCHAR(100),
  seller_id UUID REFERENCES auth.users(id),
  seller_name VARCHAR(255),
  seller_email VARCHAR(255),
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_site_settings_page ON site_settings(page);
CREATE INDEX IF NOT EXISTS idx_pages_content_slug ON pages_content(slug);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);

-- Insérer les paramètres par défaut
INSERT INTO site_settings (page, settings) VALUES 
  ('homepage', '{"hero_title": "TLSTT", "hero_subtitle": "Tennis de Table \u00e0 Toulon La Seyne", "stats_members": 221, "stats_teams": 8, "stats_years": 30, "show_news": true, "show_partners": true, "show_labels": true}'::jsonb),
  ('global', '{"site_name": "TLSTT", "club_number": "08830065", "contact_email": "contact@tlstt.fr"}'::jsonb),
  ('club', '{"name": "Toulon La Seyne Tennis de Table", "city": "La Seyne-sur-Mer", "postal_code": "83500"}'::jsonb),
  ('contact', '{"form_enabled": true, "subjects": ["Question g\u00e9n\u00e9rale", "Inscription", "Partenariat", "Autre"]}'::jsonb)
ON CONFLICT (page) DO NOTHING;

-- Insérer contenu pages légales par défaut
INSERT INTO pages_content (slug, title, content) VALUES 
  ('mentions-legales', 'Mentions L\u00e9gales', '# Mentions L\u00e9gales\n\n## \u00c9diteur\nToulon La Seyne Tennis de Table (TLSTT)\n\n## H\u00e9bergement\nVercel Inc.'),
  ('confidentialite', 'Politique de Confidentialit\u00e9', '# Politique de Confidentialit\u00e9\n\n## Collecte des donn\u00e9es\nNous collectons uniquement les donn\u00e9es n\u00e9cessaires au fonctionnement du site.'),
  ('cookies', 'Politique des Cookies', '# Politique des Cookies\n\n## Qu''est-ce qu''un cookie ?\nUn cookie est un petit fichier texte stock\u00e9 sur votre appareil.')
ON CONFLICT (slug) DO NOTHING;

-- RLS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour settings et pages
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read pages_content" ON pages_content FOR SELECT USING (true);
CREATE POLICY "Public read active products" ON shop_products FOR SELECT USING (active = true);
CREATE POLICY "Public read approved listings" ON marketplace_listings FOR SELECT USING (status = 'approved');

-- Écriture pour admins authentifiés
CREATE POLICY "Admin write site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write pages_content" ON pages_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write shop_products" ON shop_products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write shop_orders" ON shop_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write marketplace" ON marketplace_listings FOR ALL USING (auth.role() = 'authenticated');
