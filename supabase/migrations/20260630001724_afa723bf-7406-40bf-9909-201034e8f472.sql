
-- Fix infinite recursion in profiles RLS by using a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.current_profile_scope()
RETURNS TABLE(college_id uuid, department_id uuid, location_id uuid, gender text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT college_id, department_id, location_id, gender::text
  FROM public.profiles
  WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Users can view peers in same group" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view peers in same group"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.current_profile_scope() s
    WHERE s.college_id IS NOT NULL
      AND profiles.college_id = s.college_id
      AND (s.department_id IS NULL OR profiles.department_id = s.department_id)
      AND (s.location_id IS NULL OR profiles.location_id IS NULL OR profiles.location_id = s.location_id)
      AND (s.gender IS NULL OR profiles.gender::text = s.gender)
  )
);
