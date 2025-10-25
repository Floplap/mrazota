-- health_check.sql
-- Checks presence of core tables, RLS and important indexes

-- 1) Expected tables
SELECT table_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=table_name) as present
FROM (VALUES ('profiles'),('posts'),('products'),('orders'),('messages')) AS t(table_name);

-- 2) RLS enabled?
SELECT table_name, relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND table_name IN ('profiles','posts','orders','messages','products');

-- 3) Helpful indexes
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('posts','orders','products');

-- 4) Row counts (quick seed check)
SELECT 'profiles' AS table, count(*) as cnt FROM profiles
UNION ALL SELECT 'posts', count(*) FROM posts
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'orders', count(*) FROM orders;
