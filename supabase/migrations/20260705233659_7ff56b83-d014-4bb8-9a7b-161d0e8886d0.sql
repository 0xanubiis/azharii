
-- Allow authenticated users to view all profiles (needed for cross-college invitations & DM peer display)
DROP POLICY IF EXISTS "Users can view peers in same group" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Helper: same-gender check between two users
CREATE OR REPLACE FUNCTION public.users_same_gender(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pa
    JOIN public.profiles pb ON pa.gender = pb.gender
    WHERE pa.id = _a AND pb.id = _b
  );
$$;

-- Invitations: enforce same-gender + not-self on insert
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
CREATE POLICY "Users can create invitations"
ON public.invitations FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND sender_id <> receiver_id
  AND public.users_same_gender(sender_id, receiver_id)
);

-- DM channels: enforce same-gender between the two participants
DROP POLICY IF EXISTS "Users can create DM channels" ON public.dm_channels;
CREATE POLICY "Users can create DM channels"
ON public.dm_channels FOR INSERT
TO authenticated
WITH CHECK (
  (user1_id = auth.uid() OR user2_id = auth.uid())
  AND user1_id <> user2_id
  AND public.users_same_gender(user1_id, user2_id)
);
