-- 1. Separate moderation-sensitive fields into an admin-only table
CREATE TABLE public.profile_moderation (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_at timestamptz,
  ban_reason text,
  timeout_until timestamptz,
  kicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_moderation TO authenticated;
GRANT ALL ON public.profile_moderation TO service_role;

ALTER TABLE public.profile_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation records"
ON public.profile_moderation FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_profile_moderation_updated_at
BEFORE UPDATE ON public.profile_moderation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate existing data
INSERT INTO public.profile_moderation (user_id, banned_at, ban_reason, timeout_until, kicked_at)
SELECT id, banned_at, ban_reason, timeout_until, kicked_at
FROM public.profiles
WHERE banned_at IS NOT NULL OR ban_reason IS NOT NULL
   OR timeout_until IS NOT NULL OR kicked_at IS NOT NULL;

-- 3. Update dependent functions to the new source of truth
CREATE OR REPLACE FUNCTION public.can_user_post(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profile_moderation
    WHERE user_id = _user_id
      AND (banned_at IS NOT NULL OR (timeout_until IS NOT NULL AND timeout_until > now()))
  );
$$;

CREATE OR REPLACE FUNCTION public.my_moderation_status()
RETURNS TABLE(banned_at timestamptz, ban_reason text, timeout_until timestamptz, kicked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT m.banned_at, m.ban_reason, m.timeout_until, m.kicked_at
  FROM public.profile_moderation m
  WHERE m.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.admin_moderation_list()
RETURNS TABLE(user_id uuid, banned_at timestamptz, ban_reason text, timeout_until timestamptz, kicked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT m.user_id, m.banned_at, m.ban_reason, m.timeout_until, m.kicked_at
  FROM public.profile_moderation m
  WHERE public.has_role(auth.uid(), 'admin');
$$;

-- 4. Drop moderation columns from profiles (no longer needed there)
DROP TRIGGER IF EXISTS protect_profile_moderation ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_moderation_fields();

ALTER TABLE public.profiles
  DROP COLUMN banned_at,
  DROP COLUMN ban_reason,
  DROP COLUMN timeout_until,
  DROP COLUMN kicked_at;

REVOKE EXECUTE ON FUNCTION public.can_user_post(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
