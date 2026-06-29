
-- Moderation fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS timeout_until timestamptz,
  ADD COLUMN IF NOT EXISTS kicked_at timestamptz;

-- Prevent non-admins from clearing their own moderation state
CREATE OR REPLACE FUNCTION public.protect_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.banned_at   := OLD.banned_at;
    NEW.ban_reason  := OLD.ban_reason;
    NEW.timeout_until := OLD.timeout_until;
    NEW.kicked_at   := OLD.kicked_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_moderation ON public.profiles;
CREATE TRIGGER protect_profile_moderation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_moderation_fields();

-- Helper: can the current user post right now?
CREATE OR REPLACE FUNCTION public.can_user_post(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND (
        banned_at IS NOT NULL
        OR (timeout_until IS NOT NULL AND timeout_until > now())
      )
  );
$$;

-- Block banned / timed-out users from posting channel messages
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_user_post(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'publisher')
    OR channel_id IN (
      SELECT c.id FROM public.channels c
      WHERE c.is_official = false
        AND (
          c.department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
          OR c.college_id IN (SELECT college_id FROM public.profiles WHERE id = auth.uid())
        )
    )
  )
);

-- Block banned / timed-out users from sending DMs
DROP POLICY IF EXISTS "Users can send DMs" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can insert dm messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can send dm messages" ON public.dm_messages;
CREATE POLICY "Users can send dm messages"
ON public.dm_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.can_user_post(auth.uid())
);
