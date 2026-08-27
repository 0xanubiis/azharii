CREATE POLICY "Users can read own moderation record"
ON public.profile_moderation FOR SELECT TO authenticated
USING (user_id = auth.uid());
