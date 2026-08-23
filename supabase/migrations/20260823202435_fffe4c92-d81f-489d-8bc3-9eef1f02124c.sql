-- 1. Hide moderation columns from regular members (column-level privileges)
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, full_name, username, gender, college_id, department_id, location_id,
  avatar_url, onboarding_completed, created_at, updated_at,
  last_name_change_at, last_username_change_at, notify_dm, notify_invitations
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Self access to own moderation status
CREATE OR REPLACE FUNCTION public.my_moderation_status()
RETURNS TABLE(banned_at timestamptz, ban_reason text, timeout_until timestamptz, kicked_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT banned_at, ban_reason, timeout_until, kicked_at
  FROM public.profiles
  WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_moderation_status() FROM public;
GRANT EXECUTE ON FUNCTION public.my_moderation_status() TO authenticated;

-- 3. Admin-only access to everyone's moderation status
CREATE OR REPLACE FUNCTION public.admin_moderation_list()
RETURNS TABLE(user_id uuid, banned_at timestamptz, ban_reason text, timeout_until timestamptz, kicked_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.banned_at, p.ban_reason, p.timeout_until, p.kicked_at
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin');
$$;
REVOKE ALL ON FUNCTION public.admin_moderation_list() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_moderation_list() TO authenticated;

-- 4. Message file access check
CREATE OR REPLACE FUNCTION public.can_access_message_file(_path text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      _path LIKE auth.uid()::text || '/%'
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.dm_messages dm
        JOIN public.dm_channels c ON c.id = dm.dm_channel_id
        WHERE dm.file_url = _path
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.channels ch ON ch.id = m.channel_id
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE m.file_url = _path
          AND (ch.college_id IS NULL OR ch.college_id = p.college_id)
          AND (ch.department_id IS NULL OR ch.department_id = p.department_id)
          AND (ch.location_id IS NULL OR ch.location_id = p.location_id)
          AND (ch.gender IS NULL OR ch.gender = p.gender)
      )
    );
$$;
REVOKE ALL ON FUNCTION public.can_access_message_file(text) FROM public;
GRANT EXECUTE ON FUNCTION public.can_access_message_file(text) TO authenticated;

-- 5. Storage policies for message-files
DROP POLICY IF EXISTS "message_files_read" ON storage.objects;
DROP POLICY IF EXISTS "message_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "message_files_delete" ON storage.objects;

CREATE POLICY "message_files_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'message-files' AND public.can_access_message_file(name));

CREATE POLICY "message_files_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-files'
  AND name LIKE auth.uid()::text || '/%'
);

CREATE POLICY "message_files_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'message-files'
  AND (name LIKE auth.uid()::text || '/%' OR public.has_role(auth.uid(), 'admin'))
);