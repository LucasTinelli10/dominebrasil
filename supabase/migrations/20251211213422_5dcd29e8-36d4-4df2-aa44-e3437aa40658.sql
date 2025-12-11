-- Add new columns to instructors_details
ALTER TABLE public.instructors_details 
ADD COLUMN IF NOT EXISTS credential_expiry date,
ADD COLUMN IF NOT EXISTS cnh_qrcode_raw text,
ADD COLUMN IF NOT EXISTS background_check_status text DEFAULT 'pending' CHECK (background_check_status IN ('clear', 'flagged', 'pending'));

-- Create storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for verification-docs bucket
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role to read all docs (for AI verification)
CREATE POLICY "Service role can read all verification docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-docs');

-- Add admin role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE app_role ADD VALUE 'admin';
  END IF;
END $$;