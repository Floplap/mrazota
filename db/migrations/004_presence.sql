-- 004_presence.sql
-- Presence table and RPC for heartbeat updates

CREATE TABLE public.presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline', -- online | offline | playing
  last_seen timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON public.presence(last_seen DESC);

CREATE OR REPLACE FUNCTION public.set_user_presence(p_user_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.presence (user_id, status, last_seen)
  VALUES (p_user_id, p_status, now())
  ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, last_seen = now();
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.presence TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_presence(uuid, text) TO authenticated;

-- Optional: Cleanup old presence entries (can be scheduled server-side)
-- DELETE FROM public.presence WHERE last_seen < now() - interval '1 day';
