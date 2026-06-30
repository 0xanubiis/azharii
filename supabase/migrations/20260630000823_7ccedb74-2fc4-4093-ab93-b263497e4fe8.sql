
-- Add scoping columns to channels
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.college_locations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS gender gender_type;

-- Tighten channel visibility: a channel is visible only if every scoping field
-- either is NULL (open) or matches the viewer's profile.
DROP POLICY IF EXISTS "Users can view channels in their department" ON public.channels;
CREATE POLICY "Users can view channels matching their profile"
ON public.channels FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (channels.college_id    IS NULL OR channels.college_id    = p.college_id)
      AND (channels.department_id IS NULL OR channels.department_id = p.department_id)
      AND (channels.location_id   IS NULL OR channels.location_id   = p.location_id)
      AND (channels.gender        IS NULL OR channels.gender        = p.gender)
  )
);

-- Messages: viewers only see messages from channels they can see (same scoping)
DROP POLICY IF EXISTS "Users can view messages in accessible channels" ON public.messages;
CREATE POLICY "Users can view messages in accessible channels"
ON public.messages FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.channels c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = messages.channel_id
      AND (c.college_id    IS NULL OR c.college_id    = p.college_id)
      AND (c.department_id IS NULL OR c.department_id = p.department_id)
      AND (c.location_id   IS NULL OR c.location_id   = p.location_id)
      AND (c.gender        IS NULL OR c.gender        = p.gender)
  )
);

-- Posting: same scoping (non-official) + admin/publisher bypass
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND can_user_post(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'publisher'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.channels c
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = messages.channel_id
        AND c.is_official = false
        AND (c.college_id    IS NULL OR c.college_id    = p.college_id)
        AND (c.department_id IS NULL OR c.department_id = p.department_id)
        AND (c.location_id   IS NULL OR c.location_id   = p.location_id)
        AND (c.gender        IS NULL OR c.gender        = p.gender)
    )
  )
);
