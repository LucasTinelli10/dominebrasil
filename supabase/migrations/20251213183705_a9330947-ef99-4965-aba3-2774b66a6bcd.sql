-- FIX 1: Remove policy that exposes all car columns to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view available approved cars" ON public.cars;

-- Cars should only be accessible via secure functions or by owners
-- The get_available_cars() and get_car_public_details() functions already exist and return only safe fields

-- FIX 2: For instructors_details, we need authenticated users to access BASIC info
-- But we already removed the permissive policy. 
-- The secure functions get_public_instructor_details() and get_all_approved_instructors() already handle this.

-- Add documentation comments
COMMENT ON FUNCTION public.get_available_cars() IS 'Returns available cars with only public fields. Use this instead of direct table access.';
COMMENT ON FUNCTION public.get_all_approved_instructors() IS 'Returns approved instructors with only public profile and instructor fields. Use this instead of direct table access.';