-- 004_seed.sql
-- Minimal seed data for development

INSERT INTO products (id, title, description, price)
VALUES
  (gen_random_uuid(), 'Sample Product A', 'Demo product A', 9.99),
  (gen_random_uuid(), 'Sample Product B', 'Demo product B', 19.99)
ON CONFLICT DO NOTHING;

-- Create an example profile (adjust auth_id to match your auth user id)
INSERT INTO profiles (id, auth_id, email, full_name)
VALUES (gen_random_uuid(), 'local:1', 'dev@example.com', 'Dev User')
ON CONFLICT DO NOTHING;
