-- 003_seed_levels.sql
-- Seed initial levels and set default profile level

INSERT INTO public.levels (level_number, xp_required, perks) VALUES
  (1, 0,         '{"badge": "newbie"}'),
  (2, 100,       '{"badge": "novice"}'),
  (3, 300,       '{"badge": "apprentice"}'),
  (4, 700,       '{"badge": "adept"}'),
  (5, 1500,      '{"badge": "expert"}'),
  (6, 3500,      '{"badge": "master"}'),
  (7, 8000,      '{"badge": "grandmaster"}'),
  (8, 18000,     '{"badge": "legend"}');

-- Ensure there is at least a level 1
-- In case levels table already had rows, upsert behavior is desired. Use ON CONFLICT on level_number.

-- Upsert pattern (works on Postgres >=9.5)
INSERT INTO public.levels (level_number, xp_required, perks)
VALUES
  (1, 0, '{"badge": "newbie"}'),
  (2, 100, '{"badge": "novice"}'),
  (3, 300, '{"badge": "apprentice"}'),
  (4, 700, '{"badge": "adept"}'),
  (5, 1500, '{"badge": "expert"}'),
  (6, 3500, '{"badge": "master"}'),
  (7, 8000, '{"badge": "grandmaster"}'),
  (8, 18000, '{"badge": "legend"}')
ON CONFLICT (level_number) DO UPDATE SET xp_required = EXCLUDED.xp_required, perks = EXCLUDED.perks;

-- Set level_id = 1 for profiles missing level
UPDATE public.profiles SET level_id = 1 WHERE level_id IS NULL;

-- Optional: re-calculate level_id for profiles based on xp (best-effort)
-- This query sets level_id to the highest level where xp_required <= profiles.xp
WITH lvl AS (
  SELECT id AS level_id, level_number, xp_required FROM public.levels
)
UPDATE public.profiles p
SET level_id = sub.level_id
FROM (
  SELECT p2.id AS pid, l.level_id
  FROM public.profiles p2
  JOIN LATERAL (
    SELECT id AS level_id
    FROM public.levels
    WHERE xp_required <= COALESCE(p2.xp, 0)
    ORDER BY xp_required DESC
    LIMIT 1
  ) l ON true
) sub
WHERE p.id = sub.pid;

-- End of seed
