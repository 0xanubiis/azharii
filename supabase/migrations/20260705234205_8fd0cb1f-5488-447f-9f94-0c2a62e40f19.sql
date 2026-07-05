
-- Point dm_messages.sender_id FK at public.profiles so PostgREST can embed the sender profile
ALTER TABLE public.dm_messages
  DROP CONSTRAINT IF EXISTS dm_messages_sender_id_fkey;

ALTER TABLE public.dm_messages
  ADD CONSTRAINT dm_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
