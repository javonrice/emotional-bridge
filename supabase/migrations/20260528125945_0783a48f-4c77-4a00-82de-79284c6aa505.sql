CREATE POLICY "Deny all client access to tts-cache"
ON storage.objects
FOR ALL
TO anon, authenticated
USING (bucket_id <> 'tts-cache')
WITH CHECK (bucket_id <> 'tts-cache');