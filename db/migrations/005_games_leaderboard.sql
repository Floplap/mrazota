-- 005_games_leaderboard.sql
-- RPC to record game result, update leaderboard and award XP

-- Ensure leaderboard table exists (created in 001_init_tables.sql), create RPC
CREATE OR REPLACE FUNCTION public.record_game_result(p_game_id uuid, p_user_id uuid, p_score bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  existing_score bigint;
  new_score bigint := p_score;
  awarded_xp int := 0;
BEGIN
  -- fetch existing score (if any)
  SELECT score INTO existing_score FROM public.leaderboard WHERE user_id = p_user_id LIMIT 1;

  IF existing_score IS NULL THEN
    -- insert new leaderboard entry
    INSERT INTO public.leaderboard (user_id, score, created_at) VALUES (p_user_id, new_score, now());
  ELSE
    -- update only if new score is higher
    IF new_score > existing_score THEN
      UPDATE public.leaderboard SET score = new_score, created_at = now() WHERE user_id = p_user_id;
    ELSE
      new_score := existing_score; -- keep old
    END IF;
  END IF;

  -- award XP based on score (example: 1 XP per 10 points)
  awarded_xp := GREATEST(1, FLOOR(p_score::numeric / 10));

  -- call increment_profile_xp to add xp (this RPC exists from migration 001)
  PERFORM public.increment_profile_xp(p_user_id, awarded_xp);

  RETURN jsonb_build_object('user_id', p_user_id, 'score', new_score, 'awarded_xp', awarded_xp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_game_result(uuid, uuid, bigint) TO authenticated;

-- Optional: index on leaderboard.score for fast top queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC);

-- Helper RPC: get_user_rank(user_id uuid) -> returns rank position (1-based) and score
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id uuid)
RETURNS TABLE(rank bigint, score bigint)
LANGUAGE sql
AS $$
  SELECT rank, score FROM (
    SELECT user_id, score, RANK() OVER (ORDER BY score DESC) AS rank
    FROM public.leaderboard
  ) t WHERE t.user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_rank(uuid) TO authenticated;
