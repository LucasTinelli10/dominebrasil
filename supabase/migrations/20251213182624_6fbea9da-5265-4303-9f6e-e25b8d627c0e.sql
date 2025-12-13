-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy: Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy: Anyone can view basic info of approved instructors (needed for instructor search)
-- This only allows viewing profiles that have role 'instructor' in user_roles table and are approved
CREATE POLICY "Public can view approved instructor profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.id
    AND user_roles.role = 'instructor'
  )
  AND verification_status = 'approved'
);

-- Create a secure view for public instructor listings that hides sensitive fields
CREATE OR REPLACE VIEW public.public_instructor_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.city,
  p.avatar_url,
  p.verification_status
  -- Explicitly NOT exposing: neighborhood, fraud_score, verification_reason, balance
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'instructor'
AND p.verification_status = 'approved';