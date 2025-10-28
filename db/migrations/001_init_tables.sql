-- 001_init_tables.sql
-- Initial schema for MRAZOTA frontend features

-- Enable extensions commonly used
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  username text,
  avatar_url text,
  xp bigint DEFAULT 0,
  level_id int,
  online_status text DEFAULT 'offline',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Levels
CREATE TABLE IF NOT EXISTS public.levels (
  id serial PRIMARY KEY,
  level_number int NOT NULL UNIQUE,
  xp_required bigint NOT NULL,
  perks jsonb
);

-- XP transactions
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount int NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Messages and rooms for chat
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text,
  type text DEFAULT 'group', -- public|private|group
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text,
  attachment_url text,
  created_at timestamptz DEFAULT now()
);

-- Music tracks and related
CREATE TABLE IF NOT EXISTS public.music_tracks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  uploader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text,
  storage_path text,
  duration int,
  plays bigint DEFAULT 0,
  likes_count int DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.track_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  track_id uuid REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (track_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.track_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  track_id uuid REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

-- Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  track_ids uuid[] DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Forum topics and posts
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tags text[],
  created_at timestamptz DEFAULT now(),
  last_post_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id uuid REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text,
  moderated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Friends
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- pending|accepted|blocked
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

-- Game rooms and leaderboard
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  players jsonb,
  state jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  score bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Store
CREATE TABLE IF NOT EXISTS public.store_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text,
  description text,
  price numeric(10,2),
  stock int DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  items jsonb,
  total numeric(10,2),
  status text DEFAULT 'pending',
  payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

-- RPC: increment_profile_xp(user uuid, amount int)
CREATE OR REPLACE FUNCTION public.increment_profile_xp(p_user_id uuid, p_amount int)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  current_xp bigint;
  new_xp bigint;
  current_level_id int;
  next_level record;
  level_up boolean := false;
  new_level_id int;
BEGIN
  SELECT xp, level_id INTO current_xp, current_level_id FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  new_xp := COALESCE(current_xp,0) + p_amount;

  -- write xp transaction
  INSERT INTO public.xp_transactions(user_id, amount, reason, created_at) VALUES (p_user_id, p_amount, 'rpc_increment', now());

  -- find highest level where xp_required <= new_xp
  SELECT id, level_number INTO next_level FROM public.levels WHERE xp_required <= new_xp ORDER BY level_number DESC LIMIT 1;

  IF FOUND THEN
    new_level_id := next_level.id;
  ELSE
    new_level_id := current_level_id;
  END IF;

  IF new_level_id IS DISTINCT FROM current_level_id THEN
    level_up := true;
  END IF;

  UPDATE public.profiles SET xp = new_xp, level_id = new_level_id WHERE id = p_user_id;

  RETURN jsonb_build_object('user_id', p_user_id, 'old_xp', current_xp, 'new_xp', new_xp, 'level_up', level_up, 'new_level_id', new_level_id);
END;
$$;

-- RPC: increment_play_count(track_id uuid)
CREATE OR REPLACE FUNCTION public.increment_play_count(p_track_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.music_tracks SET plays = COALESCE(plays,0) + 1 WHERE id = p_track_id;
END;
$$;

-- Grant minimal rights (for migrations; refine later with RLS)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- End of migration
