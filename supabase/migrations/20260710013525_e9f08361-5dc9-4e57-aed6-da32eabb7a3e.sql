
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_name_change_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_username_change_at timestamptz,
  ADD COLUMN IF NOT EXISTS notify_dm boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_invitations boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.enforce_name_change_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  is_admin := auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin');

  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    IF NOT is_admin AND OLD.last_name_change_at IS NOT NULL
       AND OLD.last_name_change_at > now() - interval '60 days' THEN
      RAISE EXCEPTION 'يمكنك تغيير الاسم كل 60 يومًا فقط';
    END IF;
    NEW.last_name_change_at := now();
  END IF;

  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF NOT is_admin AND OLD.last_username_change_at IS NOT NULL
       AND OLD.last_username_change_at > now() - interval '60 days' THEN
      RAISE EXCEPTION 'يمكنك تغيير اسم المستخدم كل 60 يومًا فقط';
    END IF;
    NEW.last_username_change_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_name_change_cooldown_trg ON public.profiles;
CREATE TRIGGER enforce_name_change_cooldown_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_name_change_cooldown();

ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());
