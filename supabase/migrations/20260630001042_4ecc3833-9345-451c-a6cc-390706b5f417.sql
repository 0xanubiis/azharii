
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view peers in same group"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.id = auth.uid()
      AND me.college_id    IS NOT NULL AND me.college_id    = profiles.college_id
      AND me.department_id IS NOT NULL AND me.department_id = profiles.department_id
      AND me.location_id   IS NOT NULL AND me.location_id   = profiles.location_id
      AND me.gender        = profiles.gender
  )
);

ALTER TABLE public.channels REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
