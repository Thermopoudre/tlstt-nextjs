-- ==============================================
-- MIGRATION: Fonctionnalités Membres TLSTT
-- ==============================================

-- Table pour les labels FFTT (page accueil)
CREATE TABLE IF NOT EXISTS labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table profils membres (extension de auth.users)
CREATE TABLE IF NOT EXISTS member_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  licence_fftt VARCHAR(20),
  birth_date DATE,
  avatar_url TEXT,
  newsletter_subscribed BOOLEAN DEFAULT true,
  secretariat_notifications BOOLEAN DEFAULT true,
  membership_status VARCHAR(20) DEFAULT 'pending', -- pending, active, expired
  membership_expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table produits boutique
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50), -- textile, equipment, accessories
  sizes TEXT[], -- pour textiles
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table commandes boutique
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
  items JSONB NOT NULL, -- [{product_id, quantity, size, price}]
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, ready, delivered
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table annonces marketplace
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- raquette, revetement, textile, chaussures, robot, table, autre
  condition VARCHAR(20) NOT NULL, -- neuf, tres_bon, bon, correct, use
  price DECIMAL(10,2),
  is_exchange BOOLEAN DEFAULT false,
  is_gift BOOLEAN DEFAULT false,
  images TEXT[],
  status VARCHAR(20) DEFAULT 'active', -- active, sold, reserved, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table messages marketplace
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table communications secretariat
CREATE TABLE IF NOT EXISTS secretariat_communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info', -- info, important, urgent
  target_audience VARCHAR(20) DEFAULT 'all', -- all, competition, loisir, jeunes
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE secretariat_communications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Labels are viewable by everyone" ON labels FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own profile" ON member_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON member_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON member_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Products viewable by authenticated" ON shop_products FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can view own orders" ON shop_orders FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Users can create orders" ON shop_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = member_id);
CREATE POLICY "Listings viewable by authenticated" ON marketplace_listings FOR SELECT TO authenticated USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Users can create listings" ON marketplace_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own listings" ON marketplace_listings FOR DELETE USING (auth.uid() = seller_id);
CREATE POLICY "Users can view own messages" ON marketplace_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON marketplace_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Communications viewable by authenticated" ON secretariat_communications FOR SELECT TO authenticated USING (sent_at IS NOT NULL);

-- Données de démo labels
INSERT INTO labels (name, description, image_url, display_order) VALUES
  ('Label Ecole Française de Tennis de Table', 'Label FFTT certifiant la qualité de notre école de formation', '/images/labels/eftt.png', 1),
  ('Club Formateur', 'Label reconnaissant notre engagement dans la formation des jeunes', '/images/labels/club-formateur.png', 2),
  ('Ping Santé', 'Programme santé et bien-être par le tennis de table', '/images/labels/ping-sante.png', 3);

-- Données de démo produits boutique
INSERT INTO shop_products (name, description, price, category, sizes, stock) VALUES
  ('Maillot TLSTT Officiel', 'Maillot de compétition aux couleurs du club', 35.00, 'textile', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'], 50),
  ('Short TLSTT', 'Short de compétition officiel', 25.00, 'textile', ARRAY['XS', 'S', 'M', 'L', 'XL'], 40),
  ('Survêtement TLSTT', 'Survêtement complet aux couleurs du club', 75.00, 'textile', ARRAY['S', 'M', 'L', 'XL'], 30),
  ('Sac de Sport TLSTT', 'Sac de sport avec logo du club', 45.00, 'accessories', NULL, 25),
  ('Serviette éponge TLSTT', 'Serviette aux couleurs du club', 15.00, 'accessories', NULL, 60);
