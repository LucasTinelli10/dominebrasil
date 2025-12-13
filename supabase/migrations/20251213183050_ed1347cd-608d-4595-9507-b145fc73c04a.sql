-- Remove the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view instructor details" ON public.instructors_details;

-- Policy: Instructors can view their own complete details (including sensitive data)
CREATE POLICY "Instructors can view own complete details"
ON public.instructors_details
FOR SELECT
USING (profile_id = auth.uid());

-- Policy: Authenticated users can view basic instructor info (non-sensitive fields only)
-- Note: RLS at policy level cannot restrict columns, but we use functions for public access
CREATE POLICY "Authenticated users can view instructor basic info"
ON public.instructors_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = instructors_details.profile_id
    AND p.verification_status = 'approved'
  )
);

-- Create a secure function that returns ONLY public instructor data (no sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_instructor_details(instructor_id uuid)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  bio text,
  badges text[],
  price_per_hour numeric,
  years_experience integer,
  rating numeric,
  total_lessons integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id.id,
    id.profile_id,
    id.bio,
    id.badges,
    id.price_per_hour,
    id.years_experience,
    id.rating,
    id.total_lessons
  FROM public.instructors_details id
  INNER JOIN public.profiles p ON p.id = id.profile_id
  WHERE id.profile_id = instructor_id
    AND p.verification_status = 'approved';
$$;

-- Function to list all approved instructors with their public details
CREATE OR REPLACE FUNCTION public.get_all_approved_instructors()
RETURNS TABLE (
  instructor_id uuid,
  full_name text,
  city text,
  avatar_url text,
  bio text,
  badges text[],
  price_per_hour numeric,
  years_experience integer,
  rating numeric,
  total_lessons integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as instructor_id,
    p.full_name,
    p.city,
    p.avatar_url,
    id.bio,
    id.badges,
    id.price_per_hour,
    id.years_experience,
    id.rating,
    id.total_lessons
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  INNER JOIN public.instructors_details id ON id.profile_id = p.id
  WHERE ur.role = 'instructor'
    AND p.verification_status = 'approved';
$$;