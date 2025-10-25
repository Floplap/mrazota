-- supabase/rollback.sql
-- Safe rollback template. This file contains example SQL statements you can
-- use to reverse recent schema changes. Most destructive statements are
-- commented out — review and uncomment only after taking a DB snapshot.

-- IMPORTANT:
-- 1) Take a FULL backup of your production DB before running anything here.
--    Example: pg_dump --format=custom --file=backup.dump "$DATABASE_URL"
-- 2) Run these statements in a transaction when possible and test on staging first.

-- -----------------------------
-- Example: Drop RPCs / functions created by migration
-- -----------------------------
-- Note: dropping functions may break code that expects them. Use with care.
-- DROP FUNCTION IF EXISTS create_order(jsonb);

-- -----------------------------
-- Example: Drop triggers / helper functions
-- -----------------------------
-- DROP TRIGGER IF EXISTS trg_notify_orders ON orders;
-- DROP FUNCTION IF EXISTS notify_orders_change();
-- DROP TRIGGER IF EXISTS trg_set_updated_at ON orders;
-- DROP FUNCTION IF EXISTS set_updated_at();

-- -----------------------------
-- Example: Remove indexes added in migrations (non-destructive)
-- -----------------------------
-- DROP INDEX IF EXISTS idx_posts_author;
-- DROP INDEX IF EXISTS idx_orders_user;
-- DROP INDEX IF EXISTS idx_products_title;

-- -----------------------------
-- Example: Remove example policies (revert to no-policy state)
-- -----------------------------
-- DROP POLICY IF EXISTS profiles_owner_select ON profiles;
-- DROP POLICY IF EXISTS profiles_owner_mod ON profiles;
-- DROP POLICY IF EXISTS posts_public_read ON posts;
-- DROP POLICY IF EXISTS posts_create_auth ON posts;
-- DROP POLICY IF EXISTS posts_owner_modify ON posts;
-- DROP POLICY IF EXISTS orders_owner_full ON orders;
-- DROP POLICY IF EXISTS messages_participant ON messages;

-- -----------------------------
-- Example: Drop seed data (non-destructive but irreversible)
-- -----------------------------
-- -- Delete the sample products inserted by seed (identify by title if unique)
-- DELETE FROM products WHERE title IN ('Sample Product A','Sample Product B');

-- -----------------------------
-- DESTRUCTIVE: drop tables (UNCOMMENT ONLY AFTER BACKUP AND VALIDATION)
-- -----------------------------
-- WARNING: The following will permanently remove data. Use only if you
-- intentionally created temporary tables in a failed migration.
-- BEGIN;
-- DROP TABLE IF EXISTS order_items;
-- DROP TABLE IF EXISTS orders;
-- -- Other tables (uncomment only if you intentionally created them and want them removed):
-- -- DROP TABLE IF EXISTS messages;
-- -- DROP TABLE IF EXISTS friends;
-- COMMIT;

-- -----------------------------
-- Helpful checks before applying rollback
-- -----------------------------
-- List policies for quick review
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr, pg_get_expr(polwithcheck, polrelid) AS with_check
-- FROM pg_policy
-- WHERE polrelid::regclass::text IN ('profiles','posts','orders','messages');

-- List functions that might be removed
-- SELECT proname, pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE proname ILIKE 'create_order' OR proname ILIKE 'notify_%' OR proname ILIKE 'set_updated_at';

-- -----------------------------
-- Notes
-- - This file is a template. Customize it for your project and test on staging.
-- - Keep it under version control so rollback steps are auditable.
