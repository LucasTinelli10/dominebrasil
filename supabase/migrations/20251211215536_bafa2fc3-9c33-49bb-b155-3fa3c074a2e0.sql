-- Add verification fields to cars table
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS crlv_url text,
ADD COLUMN IF NOT EXISTS photo_exterior_front text,
ADD COLUMN IF NOT EXISTS photo_interior_passenger text,
ADD COLUMN IF NOT EXISTS photo_exterior_side text,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'analyzing', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS ai_analysis_report jsonb DEFAULT '{}'::jsonb;

-- Create storage bucket for car verification photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-verification-docs', 'car-verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for car verification bucket
CREATE POLICY "Investors can upload car verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'car-verification-docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Investors can view own car verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'car-verification-docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Investors can update own car verification docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'car-verification-docs' AND
  auth.uid() IS NOT NULL
);