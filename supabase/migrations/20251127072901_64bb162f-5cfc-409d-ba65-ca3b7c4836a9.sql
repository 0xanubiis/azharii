-- Update RLS policies to allow admins full access to everything

-- Channels: Admins can view and manage all channels
DROP POLICY IF EXISTS "Admins can manage channels" ON public.channels;
DROP POLICY IF EXISTS "Users can view channels in their department" ON public.channels;

CREATE POLICY "Admins can manage channels"
ON public.channels
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view channels in their department"
ON public.channels
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())) OR
  (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid()))
);

-- Messages: Admins can view and manage all messages
DROP POLICY IF EXISTS "Users can view messages in accessible channels" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

CREATE POLICY "Users can view messages in accessible channels"
ON public.messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  channel_id IN (
    SELECT channels.id FROM channels
    WHERE (channels.department_id IN (SELECT profiles.department_id FROM profiles WHERE profiles.id = auth.uid()))
       OR (channels.college_id IN (SELECT profiles.college_id FROM profiles WHERE profiles.id = auth.uid()))
  )
);

CREATE POLICY "Users can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'publisher'::app_role) OR
    channel_id IN (
      SELECT channels.id FROM channels
      WHERE channels.is_official = false
        AND ((channels.department_id IN (SELECT profiles.department_id FROM profiles WHERE profiles.id = auth.uid()))
         OR (channels.college_id IN (SELECT profiles.college_id FROM profiles WHERE profiles.id = auth.uid())))
    )
  )
);

CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- DM channels and messages: Admins can view all DMs
DROP POLICY IF EXISTS "Users can view own DM channels" ON public.dm_channels;
DROP POLICY IF EXISTS "Users can create DM channels" ON public.dm_channels;

CREATE POLICY "Users can view own DM channels"
ON public.dm_channels
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  user1_id = auth.uid() OR
  user2_id = auth.uid()
);

CREATE POLICY "Users can create DM channels"
ON public.dm_channels
FOR INSERT
TO authenticated
WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in own DM channels" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can insert DM messages" ON public.dm_messages;

CREATE POLICY "Users can view messages in own DM channels"
ON public.dm_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  dm_channel_id IN (
    SELECT dm_channels.id FROM dm_channels
    WHERE dm_channels.user1_id = auth.uid() OR dm_channels.user2_id = auth.uid()
  )
);

CREATE POLICY "Users can insert DM messages"
ON public.dm_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Profiles: Admins can update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));