DROP POLICY IF EXISTS "Users can view message files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to message-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');
