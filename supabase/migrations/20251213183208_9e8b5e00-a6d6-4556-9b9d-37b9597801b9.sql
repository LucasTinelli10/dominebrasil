-- Remove the policy that exposes all columns to the public
DROP POLICY IF EXISTS "Public can view approved instructor profiles" ON public.profiles;

-- Now only the "Users can view own profile" policy remains
-- Access to instructor public data should be done through the secure functions:
-- - get_approved_instructors() 
-- - get_public_instructor_profile(uuid)
-- - get_all_approved_instructors()

-- Create a new restrictive policy for authenticated users viewing instructor profiles
-- This allows authenticated users to see ONLY approved instructor profiles
-- But the application should use the secure functions to limit exposed columns
CREATE POLICY "Authenticated can view approved instructor basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.id
    AND ur.role = 'instructor'
  )
  AND verification_status = 'approved'
);

-- Drop the view that might be causing issues and recreate it more securely
DROP VIEW IF EXISTS public.public_instructor_profiles;

-- The secure functions already exist and should be used instead of direct table access
-- They explicitly return only safe fields:
-- get_approved_instructors() returns: id, full_name, city, avatar_url
-- get_public_instructor_profile(uuid) returns: id, full_name, city, avatar_url, verification_status
-- get_all_approved_instructors() returns: instructor_id, full_name, city, avatar_url, bio, badges, price_per_hour, years_experience, rating, total_lessons