
CREATE TABLE public.college_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, name_ar)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_locations TO authenticated;
GRANT ALL ON public.college_locations TO service_role;

ALTER TABLE public.college_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view college locations"
  ON public.college_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage college locations"
  ON public.college_locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN location_id uuid REFERENCES public.college_locations(id) ON DELETE SET NULL;

CREATE INDEX idx_college_locations_college_id ON public.college_locations(college_id);
CREATE INDEX idx_profiles_location_id ON public.profiles(location_id);
