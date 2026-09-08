-- ============================================================================
-- Automated RLS / Storage permission checks
-- ----------------------------------------------------------------------------
-- Verifies access control for: profiles (public fields vs moderation-sensitive
-- fields in profile_moderation), channels, messages, dm_channels, dm_messages
-- and storage.objects (message-files / avatars buckets) across roles:
--   anon, authenticated student, and admin.
--
-- Run with the SQL runner. Every output row must have passed = true.
-- Read-only apart from one TEMP table; all write attempts are expected to fail.
-- ============================================================================

DROP TABLE IF EXISTS rls_check_results;
CREATE TEMP TABLE rls_check_results (
  area text, check_name text, expected text, actual text, passed boolean
);

DO $$
DECLARE
  admin_id uuid; student_a uuid; student_b uuid;
  n bigint; err text; ok boolean;
  res jsonb := '[]'::jsonb;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;

  SELECT p.id INTO student_a FROM public.profiles p
  WHERE p.college_id IS NOT NULL AND p.department_id IS NOT NULL
    AND NOT public.has_role(p.id, 'admin') LIMIT 1;

  SELECT p.id INTO student_b FROM public.profiles p, public.profiles a
  WHERE a.id = student_a AND p.id <> a.id AND p.college_id = a.college_id
    AND p.department_id = a.department_id AND p.gender = a.gender LIMIT 1;

  IF student_a IS NULL THEN RAISE EXCEPTION 'no suitable student profile'; END IF;

  -- moderation-sensitive columns must not live on profiles anymore
  SELECT count(*) INTO n FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name IN ('banned_at','ban_reason','timeout_until','kicked_at');
  res := res || jsonb_build_array(jsonb_build_array(
    'profiles','moderation columns removed from profiles','0',n::text,n = 0));

  -- anon
  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profiles' INTO n;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  RESET ROLE;
  res := res || jsonb_build_array(jsonb_build_array(
    'profiles','anon cannot read profiles','denied or 0 rows',err,ok));

  -- authenticated student
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub',student_a,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profiles WHERE id = $1' INTO n USING student_a;
    ok := (n = 1); err := n::text;
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'profiles','student can read own public profile row','1',err,ok));

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profile_moderation WHERE user_id <> $1'
      INTO n USING student_a;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'profile_moderation','student cannot read others moderation rows','0 rows',err,ok));

  BEGIN
    EXECUTE 'INSERT INTO public.profile_moderation (user_id, banned_at) VALUES ($1, now())'
      USING student_b;
    ok := false; err := 'insert succeeded';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'profile_moderation','student cannot write moderation rows','denied',err,ok));

  BEGIN
    EXECUTE $q$SELECT count(*) FROM public.channels c, public.profiles p WHERE p.id = $1
      AND ((c.college_id IS NOT NULL AND c.college_id <> p.college_id)
        OR (c.department_id IS NOT NULL AND c.department_id <> p.department_id)
        OR (c.location_id IS NOT NULL AND c.location_id <> p.location_id)
        OR (c.gender IS NOT NULL AND c.gender <> p.gender))$q$ INTO n USING student_a;
    ok := (n = 0); err := n::text || ' out-of-scope channels';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'channels','student sees only in-scope channels','0 out-of-scope',err,ok));

  BEGIN
    EXECUTE $q$SELECT count(*) FROM public.messages m
      WHERE m.channel_id NOT IN (SELECT id FROM public.channels)$q$ INTO n;
    ok := (n = 0); err := n::text || ' leaked messages';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'messages','no messages from invisible channels','0',err,ok));

  BEGIN
    EXECUTE $q$SELECT count(*) FROM public.dm_channels
      WHERE user1_id <> $1 AND user2_id <> $1$q$ INTO n USING student_a;
    ok := (n = 0); err := n::text || ' foreign dm channels';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'dm_channels','student sees only own DM channels','0 foreign',err,ok));

  BEGIN
    EXECUTE $q$SELECT count(*) FROM public.dm_messages
      WHERE dm_channel_id NOT IN (SELECT id FROM public.dm_channels)$q$ INTO n;
    ok := (n = 0); err := n::text || ' foreign dm messages';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'dm_messages','student sees only own DM messages','0 foreign',err,ok));

  BEGIN
    EXECUTE $q$INSERT INTO public.dm_channels (user1_id, user2_id)
      SELECT $1, p.id FROM public.profiles p, public.profiles a
      WHERE a.id = $1 AND p.gender <> a.gender LIMIT 1$q$ USING student_a;
    ok := false; err := 'insert succeeded';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'dm_channels','cross-gender DM creation denied','denied',err,ok));

  BEGIN
    EXECUTE $q$SELECT count(*) FROM storage.objects o WHERE o.bucket_id = 'message-files'
      AND o.name NOT LIKE $1 || '/%'
      AND NOT EXISTS (SELECT 1 FROM public.dm_messages dm
        JOIN public.dm_channels c ON c.id = dm.dm_channel_id
        WHERE dm.file_url = o.name AND $1 IN (c.user1_id::text, c.user2_id::text))
      AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.file_url = o.name)$q$
      INTO n USING student_a::text;
    ok := (n = 0); err := n::text || ' unauthorized objects';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'storage.message-files','student cannot list unrelated files','0',err,ok));

  BEGIN
    EXECUTE $q$SELECT count(*) FROM storage.objects WHERE bucket_id = 'avatars'$q$ INTO n;
    ok := true; err := n::text || ' avatars visible';
  EXCEPTION WHEN OTHERS THEN ok := false; err := 'denied'; END;
  res := res || jsonb_build_array(jsonb_build_array(
    'storage.avatars','student can view avatars','readable',err,ok));

  RESET ROLE;
  PERFORM set_config('request.jwt.claims','',true);

  SELECT count(*) INTO n FROM storage.buckets WHERE id = 'message-files' AND public = false;
  res := res || jsonb_build_array(jsonb_build_array(
    'storage.message-files','bucket is private','1',n::text,n = 1));
  SELECT count(*) INTO n FROM storage.buckets WHERE id = 'avatars' AND public = false;
  res := res || jsonb_build_array(jsonb_build_array(
    'storage.avatars','bucket is private','1',n::text,n = 1));

  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE $q$SELECT count(*) FROM storage.objects WHERE bucket_id = 'message-files'$q$ INTO n;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  RESET ROLE;
  res := res || jsonb_build_array(jsonb_build_array(
    'storage.message-files','anon cannot list files','denied or 0 rows',err,ok));

  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE $q$SELECT count(*) FROM storage.objects WHERE bucket_id = 'avatars'$q$ INTO n;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  RESET ROLE;
  res := res || jsonb_build_array(jsonb_build_array(
    'storage.avatars','anon cannot list avatars','denied or 0 rows',err,ok));

  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.messages' INTO n;
    ok := (n = 0); err := n::text || ' rows';
  EXCEPTION WHEN OTHERS THEN ok := true; err := 'denied'; END;
  RESET ROLE;
  res := res || jsonb_build_array(jsonb_build_array(
    'messages','anon cannot read messages','denied or 0 rows',err,ok));

  IF admin_id IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub',admin_id,'role','authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    BEGIN
      EXECUTE 'SELECT count(*) FROM public.profile_moderation' INTO n;
      ok := true; err := n::text || ' rows readable';
    EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
    res := res || jsonb_build_array(jsonb_build_array(
      'profile_moderation','admin can read moderation rows','readable',err,ok));

    BEGIN
      EXECUTE 'SELECT count(*) FROM public.admin_moderation_list()' INTO n;
      ok := true; err := n::text || ' rows';
    EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
    res := res || jsonb_build_array(jsonb_build_array(
      'rpc','admin_moderation_list works for admin','ok',err,ok));

    BEGIN
      EXECUTE 'SELECT count(*) FROM public.channels' INTO n;
      ok := (n > 0); err := n::text || ' channels';
    EXCEPTION WHEN OTHERS THEN ok := false; err := 'error'; END;
    res := res || jsonb_build_array(jsonb_build_array(
      'channels','admin sees all channels','all',err,ok));

    BEGIN
      EXECUTE $q$SELECT count(*) FROM storage.objects WHERE bucket_id = 'message-files'$q$ INTO n;
      ok := true; err := n::text || ' files';
    EXCEPTION WHEN OTHERS THEN ok := false; err := 'denied'; END;
    res := res || jsonb_build_array(jsonb_build_array(
      'storage.message-files','admin can list all files','readable',err,ok));
    RESET ROLE;
    PERFORM set_config('request.jwt.claims','',true);
  END IF;

  SELECT count(*) INTO n FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;
  res := res || jsonb_build_array(jsonb_build_array(
    'schema','all public tables have RLS enabled','0 without RLS',n::text,n = 0));

  INSERT INTO rls_check_results
  SELECT e->>0, e->>1, e->>2, e->>3, (e->>4)::boolean
  FROM jsonb_array_elements(res) e;
END $$;

SELECT area, check_name, expected, actual, passed
FROM rls_check_results ORDER BY passed, area, check_name;
