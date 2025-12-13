-- Drop the current instructor policy and recreate with a more restrictive approach
-- The view public_instructor_profiles already hides sensitive data, so we can rely on that

-- First, let's add RLS to the view if needed (views inherit table RLS)
-- Since the view only selects safe fields, we just need to ensure the base policy is correct

-- Update: The issue is that the policy "Public can view approved instructor profiles" 
-- still allows access to ALL columns. We need to handle this at application level
-- or use a function-based approach.

-- For now, let's create a security definer function that returns only safe data
CREATE OR REPLACE FUNCTION public.get_public_instructor_profile(instructor_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  city text,
  avatar_url text,
  verification_status verification_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.city,
    p.avatar_url,
    p.verification_status
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = instructor_id
    AND ur.role = 'instructor'
    AND p.verification_status = 'approved';
$$;

-- Function to list all approved instructors (safe fields only)
CREATE OR REPLACE FUNCTION public.get_approved_instructors()
RETURNS TABLE (
  id uuid,
  full_name text,
  city text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.city,
    p.avatar_url
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'instructor'
    AND p.verification_status = 'approved';
$$;