-- Create admin-only RPC function for approving instructors
CREATE OR REPLACE FUNCTION admin_approve_instructor(instructor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  UPDATE profiles
  SET verification_status = 'approved',
      verification_reason = 'Aprovado manualmente pelo administrador.'
  WHERE id = instructor_id;
  
  UPDATE instructors_details
  SET background_check_status = 'clear'
  WHERE profile_id = instructor_id;
END;
$$;

-- Create admin-only RPC function for rejecting instructors
CREATE OR REPLACE FUNCTION admin_reject_instructor(instructor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  UPDATE profiles
  SET verification_status = 'rejected',
      verification_reason = 'Rejeitado pelo administrador após análise manual.'
  WHERE id = instructor_id;
  
  UPDATE instructors_details
  SET background_check_status = 'flagged'
  WHERE profile_id = instructor_id;
END;
$$;

-- Create admin-only RPC function to list instructor verifications with sensitive data
CREATE OR REPLACE FUNCTION admin_list_instructor_verifications()
RETURNS TABLE (
  id uuid,
  full_name text,
  verification_status verification_status,
  fraud_score numeric,
  verification_reason text,
  created_at timestamptz,
  cnh_number text,
  cnh_category text,
  credential_number text,
  background_check_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.verification_status,
    p.fraud_score,
    p.verification_reason,
    p.created_at,
    idet.cnh_number,
    idet.cnh_category,
    idet.credential_number,
    idet.background_check_status
  FROM profiles p
  LEFT JOIN instructors_details idet ON idet.profile_id = p.id
  INNER JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'instructor'
  ORDER BY p.created_at DESC;
END;
$$;