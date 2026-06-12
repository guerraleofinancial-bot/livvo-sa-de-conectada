
-- provider-media: owner full control under {user_id}/..., authenticated read
CREATE POLICY "provider-media owner write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "provider-media read" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'provider-media');

-- provider-documents: owner + admin only
CREATE POLICY "provider-documents owner write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "provider-documents admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'provider-documents' AND public.has_role(auth.uid(),'admin'));
