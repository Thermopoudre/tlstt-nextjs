-- Migration 005: Alerts system + article likes

-- Table alertes/bandeau (messages globaux affichés sur le site)
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

-- Table likes articles
CREATE TABLE IF NOT EXISTS news_likes (
  id BIGSERIAL PRIMARY KEY,
  news_id BIGINT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64),  -- hash de l'IP pour les non-connectés
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(news_id, user_id),
  UNIQUE(news_id, ip_hash)
);

-- Index performance
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_news_likes_news_id ON news_likes(news_id);

-- RLS alerts (lecture publique)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_public_read" ON alerts
  FOR SELECT
  USING (is_active = TRUE AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW()));

-- RLS news_likes (lecture publique, écriture selon auth)
ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_likes_public_read" ON news_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "news_likes_insert_auth" ON news_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (user_id IS NULL AND ip_hash IS NOT NULL)
  );

CREATE POLICY "news_likes_delete_own" ON news_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Admin full access (bypass RLS pour service_role)
CREATE POLICY "alerts_admin_all" ON alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
