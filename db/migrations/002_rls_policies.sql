-- 002_rls_policies.sql
-- Row-Level Security policies and example triggers for MRAZOTA

-- Note: Review policies and tighten as needed for your app's privacy requirements.

-- Enable RLS on key tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

-- ==================== Profiles ====================
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ==================== Rooms ====================
-- Select rooms if public or if user is listed in room metadata.members
CREATE POLICY rooms_select_public_or_member ON public.rooms
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      type = 'public' OR (metadata -> 'members') ? auth.uid()
    )
  );

CREATE POLICY rooms_insert_authenticated ON public.rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY rooms_update_owner ON public.rooms
  FOR UPDATE USING ((metadata ->> 'owner') = auth.uid()) WITH CHECK ((metadata ->> 'owner') = auth.uid());

-- ==================== Messages ====================
CREATE POLICY messages_select_public_or_participant ON public.messages
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      sender_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = messages.room_id AND (r.type = 'public' OR (r.metadata -> 'members') ? auth.uid()))
    )
  );

CREATE POLICY messages_insert_auth_sender ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY messages_update_own ON public.messages
  FOR UPDATE USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

CREATE POLICY messages_delete_own ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- ==================== Music Tracks ====================
-- Public read access for tracks
CREATE POLICY music_tracks_select_public ON public.music_tracks
  FOR SELECT USING (true);

CREATE POLICY music_tracks_insert_uploader ON public.music_tracks
  FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY music_tracks_update_owner ON public.music_tracks
  FOR UPDATE USING (auth.uid() = uploader_id) WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY music_tracks_delete_owner ON public.music_tracks
  FOR DELETE USING (auth.uid() = uploader_id);

-- Track likes
CREATE POLICY track_likes_insert_own ON public.track_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY track_likes_delete_own ON public.track_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY track_likes_select_owner ON public.track_likes
  FOR SELECT USING (auth.uid() = user_id);

-- Track comments
CREATE POLICY track_comments_select_public ON public.track_comments
  FOR SELECT USING (true);

CREATE POLICY track_comments_insert_author ON public.track_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY track_comments_update_author ON public.track_comments
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY track_comments_delete_author ON public.track_comments
  FOR DELETE USING (auth.uid() = author_id);

-- ==================== Playlists ====================
CREATE POLICY playlists_select_owner ON public.playlists
  FOR SELECT USING (owner_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY playlists_insert_owner ON public.playlists
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY playlists_update_owner ON public.playlists
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY playlists_delete_owner ON public.playlists
  FOR DELETE USING (owner_id = auth.uid());

-- ==================== Forum ====================
CREATE POLICY forum_topics_select_public ON public.forum_topics
  FOR SELECT USING (true);

CREATE POLICY forum_topics_insert_authenticated ON public.forum_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY forum_topics_update_author ON public.forum_topics
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY forum_topics_delete_author ON public.forum_topics
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY forum_posts_select_public ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY forum_posts_insert_authenticated ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY forum_posts_update_author ON public.forum_posts
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY forum_posts_delete_author ON public.forum_posts
  FOR DELETE USING (auth.uid() = author_id);

-- ==================== Friends ====================
CREATE POLICY friends_insert_request ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY friends_update_participant ON public.friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id) WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY friends_select_participant ON public.friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ==================== Game rooms & leaderboard ====================
CREATE POLICY game_rooms_select_member ON public.game_rooms
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      (state ->> 'public') = 'true' OR (players ? auth.uid())
    )
  );

CREATE POLICY game_rooms_insert_authenticated ON public.game_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY leaderboard_select_public ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY leaderboard_insert_authenticated ON public.leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY leaderboard_update_owner ON public.leaderboard
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==================== Store & Orders ====================
CREATE POLICY store_items_select_public ON public.store_items
  FOR SELECT USING (true);

CREATE POLICY orders_insert_owner ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY orders_select_owner ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY orders_update_owner ON public.orders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==================== XP transactions & levels ====================
CREATE POLICY xp_transactions_select_owner ON public.xp_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY xp_transactions_insert_owner ON public.xp_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY levels_select_public ON public.levels
  FOR SELECT USING (true);

-- ==================== Grant EXECUTE on RPCs to authenticated role ====================
GRANT EXECUTE ON FUNCTION public.increment_profile_xp(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_play_count(uuid) TO authenticated;

-- ==================== Example trigger: update forum_topics.last_post_at when a new post is created ====================
CREATE OR REPLACE FUNCTION public.update_forum_topic_last_post()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.forum_topics SET last_post_at = NEW.created_at WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_forum_topic_last_post ON public.forum_posts;
CREATE TRIGGER trg_update_forum_topic_last_post
AFTER INSERT ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_forum_topic_last_post();

-- End of RLS policies migration
