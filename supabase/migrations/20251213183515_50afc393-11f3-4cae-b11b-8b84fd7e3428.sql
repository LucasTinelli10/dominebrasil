-- Remove the policy that exposes all columns to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view instructor basic info" ON public.instructors_details;

-- Now ONLY the instructor themselves can see their complete details
-- Policy "Instructors can view own complete details" remains (profile_id = auth.uid())

-- All other access to instructor information should go through the secure functions:
-- - get_public_instructor_details(uuid) - returns only safe fields
-- - get_all_approved_instructors() - returns combined profile + instructor safe data

-- Add a comment to document this decision
COMMENT ON TABLE public.instructors_details IS 'Instructor details table. Direct access restricted to instructor themselves only. Use get_public_instructor_details() or get_all_approved_instructors() functions for public-facing queries.';