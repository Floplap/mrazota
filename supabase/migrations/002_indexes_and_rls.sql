-- 002_indexes_and_rls.sql
-- Indexes and basic RLS policies

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);

-- Enable Row Level Security where appropriate
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Example policies: allow owner to select/insert/update their own rows
CREATE POLICY profiles_owner_select ON profiles
  FOR SELECT USING (auth.uid()::text = auth_id);

CREATE POLICY posts_owner_full ON posts
  FOR ALL USING (auth.uid()::uuid = author_id)
  WITH CHECK (auth.uid()::uuid = author_id);

CREATE POLICY orders_owner ON orders
  FOR ALL USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- Public read for products
CREATE POLICY products_public_read ON products
  FOR SELECT USING (true);
