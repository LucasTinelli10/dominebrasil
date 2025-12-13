-- Drop the view and recreate with SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.public_instructor_profiles;

-- Recreate view with explicit SECURITY INVOKER 
CREATE VIEW public.public_instructor_profiles 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.full_name,
  p.city,
  p.avatar_url,
  p.verification_status
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'instructor'
AND p.verification_status = 'approved';