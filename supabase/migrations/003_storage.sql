-- =============================================================
-- 003_storage.sql
-- Creates the storage bucket for laundry store images and sets
-- access policies.
-- Run this file AFTER 002_rls.sql.
-- =============================================================

-- Create storage bucket for laundry images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'laundry-images',
  'laundry-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- Storage policies
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can upload laundry images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view laundry images"                ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own laundry images"     ON storage.objects;

CREATE POLICY "Authenticated users can upload laundry images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'laundry-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view laundry images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'laundry-images');

CREATE POLICY "Users can delete their own laundry images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'laundry-images' AND auth.uid() = owner);
