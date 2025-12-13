-- FIX 1: Create is_admin function for proper admin authorization checks
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- FIX 2: Restrict has_role() to only check own role or admin checking others
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow checking your own role, or if you're an admin
  IF _user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RETURN FALSE; -- Return false instead of error to prevent information leakage
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- FIX 3: Restrict get_user_role() to only get own role or admin getting others
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow getting your own role, or if you're an admin
  IF _user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RETURN NULL; -- Return NULL instead of error to prevent information leakage
  END IF;
  
  RETURN (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1);
END;
$$;

-- FIX 4: Restrict car-verification-docs storage to car owners only
DROP POLICY IF EXISTS "Authenticated users can upload car verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view car verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload car verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view car verification docs" ON storage.objects;

-- Create more restrictive policies for car-verification-docs
-- Upload: Only authenticated users can upload to their own car folders
CREATE POLICY "Owners can upload car verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'car-verification-docs' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- View: Only car owners can view their own car docs
CREATE POLICY "Owners can view own car verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'car-verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update: Only owners can update their own docs
CREATE POLICY "Owners can update own car verification docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'car-verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete: Only owners can delete their own docs
CREATE POLICY "Owners can delete own car verification docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'car-verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add documentation comments
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Checks if a user has admin role. Used for authorization decisions.';
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 'Checks if user has specific role. Restricted to own role check or admin checking others.';
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Gets user primary role. Restricted to own role or admin checking others.';