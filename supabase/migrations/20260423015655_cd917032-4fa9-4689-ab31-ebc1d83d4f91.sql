-- 1. Create enum tv_type
DO $$ BEGIN
  CREATE TYPE public.tv_type AS ENUM ('events', 'images');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add column type to tvs
ALTER TABLE public.tvs
  ADD COLUMN IF NOT EXISTS type public.tv_type NOT NULL DEFAULT 'events';

-- 3. Create storage bucket tv-images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tv-images', 'tv-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies
DROP POLICY IF EXISTS "Public read tv-images" ON storage.objects;
CREATE POLICY "Public read tv-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'tv-images');

DROP POLICY IF EXISTS "Admin insert tv-images" ON storage.objects;
CREATE POLICY "Admin insert tv-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tv-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin update tv-images" ON storage.objects;
CREATE POLICY "Admin update tv-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tv-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin delete tv-images" ON storage.objects;
CREATE POLICY "Admin delete tv-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tv-images' AND public.has_role(auth.uid(), 'admin'));