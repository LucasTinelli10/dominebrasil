-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.admin_list_pending_approvals();

-- Recreate function with phone column
CREATE FUNCTION public.admin_list_pending_approvals()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  verification_status verification_status,
  fraud_score numeric,
  verification_reason text,
  created_at timestamptz,
  avatar_url text,
  cnh_number text,
  cnh_category text,
  credential_number text,
  background_check_status text,
  documents_url jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    au.email,
    p.phone,
    (SELECT ur.role::text FROM user_roles ur WHERE ur.user_id = p.id LIMIT 1) as role,
    p.verification_status,
    p.fraud_score,
    p.verification_reason,
    p.created_at,
    p.avatar_url,
    id.cnh_number,
    id.cnh_category,
    id.credential_number,
    id.background_check_status,
    id.documents_url
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN instructors_details id ON id.profile_id = p.id
  WHERE p.verification_status IN ('pending', 'analyzing')
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id 
    AND ur.role IN ('instructor', 'investor')
  )
  ORDER BY p.created_at DESC;
END;
$$;