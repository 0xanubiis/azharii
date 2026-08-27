-- ============================================================================
-- Automated RLS / Storage permission checks
-- ----------------------------------------------------------------------------
-- Verifies access control for: profiles (public vs moderation-sensitive
-- fields), profile_moderation, channels, messages, dm_channels, dm_messages
-- and storage.objects (message-files bucket) across roles:
--   anon, authenticated student (self), another student, and admin.
--
-- Run it with the SQL runner (it is read-only apart from a TEMP table).
-- Every row of the output must have passed = true.
-- ============================================================================

DROP TABLE IF EXISTS rls_check_results;
CREATE TEMP TABLE rls_check_results (
  area text,
  check_name text,
  expected text,
  actual text,
  passed boolean
);

DO $$
DECLARE
  admin_id uuid;
  student_a uuid;
  student_b uuid;   -- same college/department/location/gender as student_a
  outsider  uuid;   -- different college
  n bigint;
  err text;

  PROCEDURE_NOTE text := 'impersonation via set_config(role/request.jwt.claims)';

  -- helper state
  ok boolean;
BEGIN
  -- ---------------- pick actors -------------------------------------------
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;

  SELECT p.id INTO student_a
  FROM public.profiles p
  WHERE p.college_id IS NOT NULL AND p.department_id IS NOT NULL
    AND NOT public.has_role(p.id, 'admin')
  LIMIT 1;

  SELECT p.id INTO student_b
  FROM public.profiles p, public.profiles a
  WHERE a.id = student_a AND p.id <> a.id
    AND p.college_id = a.college_id AND p.department_id = a.department_id
    AND p.gender = a.gender
  LIMIT 1;

  SELECT p.id INTO outsider
  FROM public.profiles p, public.profiles a
  WHERE a.id = student_a AND p.college_id IS DISTINCT FROM a.college_id
  LIMIT 1;

  IF student_a IS NULL THEN
    RAISE EXCEPTION 'no suitable student profile found for checks';
  END IF;

  -- ======================= PROFILES: column visibility ====================
  -- Sensitive moderation columns must no longer exist on profiles at all.
  SELECT count(*) INTO n
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name IN ('banned_at', 'ban_reason', 'timeout_until', 'kicked_at');
  res := res || jsonb_build_array(jsonb_build_array(
    ('profiles', 'moderation columns removed from profiles', '0', n::text, n = 0);

  -- anon must not read profiles
  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profiles' INTO n;
    ok := (n = 0);
    err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN
    ok := true; err := 'denied: ' || SQLERRM;
  END;
  RESET ROLE;
  res := res || jsonb_build_array(jsonb_build_array(
    ('profiles', 'anon cannot read profiles', 'denied or 0 rows', err, ok);

  -- authenticated student may read public columns of peers
  PERFORM set_config('request.jwt.claims', json_build_object('sub', student_a, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profiles WHERE id = $1'
      INTO n USING student_a;
    ok := n = 1; err := n::text;
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('profiles', 'student can read own public profile row', '1', err, ok);

  -- but NOT the moderation table of other users
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profile_moderation WHERE user_id <> $1'
      INTO n USING student_a;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('profile_moderation', 'student cannot read others moderation rows', '0 rows', err, ok);

  -- a student cannot write moderation data (self-unban / self-ban of others)
  BEGIN
    EXECUTE 'INSERT INTO public.profile_moderation (user_id, banned_at) VALUES ($1, now())'
      USING student_b;
    ok := false; err := 'insert succeeded';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('profile_moderation', 'student cannot write moderation rows', 'denied', err, ok);

  -- ======================= CHANNELS =======================================
  -- every channel visible to the student must match their scope
  BEGIN
    EXECUTE $q$
      SELECT count(*) FROM public.channels c, public.profiles p
      WHERE p.id = $1
        AND (
          (c.college_id IS NOT NULL AND c.college_id <> p.college_id) OR
          (c.department_id IS NOT NULL AND c.department_id <> p.department_id) OR
          (c.location_id IS NOT NULL AND c.location_id <> p.location_id) OR
          (c.gender IS NOT NULL AND c.gender <> p.gender)
        )
    $q$ INTO n USING student_a;
    ok := (n = 0); err := n::text || ' out-of-scope channels';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('channels', 'student sees only in-scope channels', '0 out-of-scope', err, ok);

  -- ======================= MESSAGES ======================================
  BEGIN
    EXECUTE $q$
      SELECT count(*) FROM public.messages m
      WHERE m.channel_id NOT IN (SELECT id FROM public.channels)
    $q$ INTO n;
    ok := (n = 0); err := n::text || ' messages from invisible channels';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('messages', 'student sees no messages from invisible channels', '0', err, ok);

  -- ======================= DMs ===========================================
  BEGIN
    EXECUTE $q$
      SELECT count(*) FROM public.dm_channels
      WHERE user1_id <> $1 AND user2_id <> $1
    $q$ INTO n USING student_a;
    ok := (n = 0); err := n::text || ' foreign dm channels';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('dm_channels', 'student sees only own DM channels', '0 foreign', err, ok);

  BEGIN
    EXECUTE $q$
      SELECT count(*) FROM public.dm_messages
      WHERE dm_channel_id NOT IN (SELECT id FROM public.dm_channels)
    $q$ INTO n;
    ok := (n = 0); err := n::text || ' foreign dm messages';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('dm_messages', 'student sees only DM messages of own channels', '0 foreign', err, ok);

  -- opposite-gender DM creation must be blocked
  BEGIN
    EXECUTE $q$
      INSERT INTO public.dm_channels (user1_id, user2_id)
      SELECT $1, p.id FROM public.profiles p, public.profiles a
      WHERE a.id = $1 AND p.gender <> a.gender LIMIT 1
    $q$ USING student_a;
    ok := false; err := 'insert succeeded';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('dm_channels', 'cross-gender DM creation denied', 'denied', err, ok);

  -- ======================= STORAGE: message-files =========================
  BEGIN
    EXECUTE $q$
      SELECT count(*) FROM storage.objects o
      WHERE o.bucket_id = 'message-files'
        AND o.name NOT LIKE $1 || '/%'
        AND NOT EXISTS (
          SELECT 1 FROM public.dm_messages dm
          JOIN public.dm_channels c ON c.id = dm.dm_channel_id
          WHERE dm.file_url = o.name AND ($1 IN (c.user1_id::text, c.user2_id::text))
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.messages m WHERE m.file_url = o.name
        )
    $q$ INTO n USING student_a::text;
    ok := (n = 0); err := n::text || ' unauthorized objects';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
  END;
  res := res || jsonb_build_array(jsonb_build_array(
    ('storage.message-files', 'student cannot list unrelated files', '0', err, ok);

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);

  -- bucket must be private
  SELECT count(*) INTO n FROM storage.buckets WHERE id = 'message-files' AND public = false;
  res := res || jsonb_build_array(jsonb_build_array(
    ('storage.message-files', 'bucket is private', '1', n::text, n = 1);

  SELECT count(*) INTO n FROM storage.buckets WHERE id = 'avatars' AND public = false;
  res := res || jsonb_build_array(jsonb_build_array(
    ('storage.avatars', 'bucket is private', '1', n::text, n = 1);

  -- anon must not list message files
  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE $q$SELECT count(*) FROM storage.objects WHERE bucket_id = 'message-files'$q$ INTO n;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied: ' || SQLERRM;
  END;
  RESET ROLE;
  res := res || jsonb_build_array(jsonb_build_array(
    ('storage.message-files', 'anon cannot list files', 'denied or 0 rows', err, ok);

  -- ======================= ADMIN =========================================
  IF admin_id IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    BEGIN
      EXECUTE 'SELECT count(*) FROM public.profile_moderation' INTO n;
      ok := true; err := n::text || ' rows readable';
    EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
    END;
    res := res || jsonb_build_array(jsonb_build_array(
      ('profile_moderation', 'admin can read moderation rows', 'readable', err, ok);

    BEGIN
      EXECUTE 'SELECT count(*) FROM public.admin_moderation_list()' INTO n;
      ok := true; err := n::text || ' rows';
    EXCEPTION WHEN OTHERS THEN ok := false; err := 'error: ' || SQLERRM;
    END;
    res := res || jsonb_build_array(jsonb_build_array(
      ('rpc', 'admin_moderation_list works for admin', 'ok', err, ok);

    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
  END IF;

  -- ======================= RLS ENABLED EVERYWHERE ========================
  SELECT count(*) INTO n
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;
  res := res || jsonb_build_array(jsonb_build_array(
    ('schema', 'all public tables have RLS enabled', '0 without RLS', n::text, n = 0);
END $$;

SELECT area, check_name, expected, actual, passed
FROM rls_check_results
ORDER BY passed, area, check_name;
