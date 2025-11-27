-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-files', 'message-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for message files bucket
CREATE POLICY "Users can upload files to message-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view message files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'message-files');

CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for better performance on mentions
CREATE INDEX IF NOT EXISTS idx_messages_content_mentions ON public.messages USING gin(to_tsvector('arabic', content));
CREATE INDEX IF NOT EXISTS idx_dm_messages_content_mentions ON public.dm_messages USING gin(to_tsvector('arabic', content));