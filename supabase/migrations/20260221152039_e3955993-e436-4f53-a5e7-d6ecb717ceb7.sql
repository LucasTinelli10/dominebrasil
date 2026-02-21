-- Allow authenticated users to view profiles of approved instructors (they are listed publicly in search)
CREATE POLICY "Users can view approved instructor profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND id IN (
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'instructor'
  )
  AND verification_status = 'approved'
);