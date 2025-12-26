-- Function to list ALL pending users (students and instructors)
CREATE OR REPLACE FUNCTION public.admin_list_pending_approvals()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  role text,
  verification_status verification_status,
  fraud_score numeric,
  verification_reason text,
  created_at timestamp with time zone,
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    (SELECT au.email FROM auth.users au WHERE au.id = p.id)::text as email,
    ur.role::text,
    p.verification_status,
    p.fraud_score,
    p.verification_reason,
    p.created_at,
    p.avatar_url,
    idet.cnh_number,
    idet.cnh_category,
    idet.credential_number,
    idet.background_check_status,
    idet.documents_url
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN instructors_details idet ON idet.profile_id = p.id
  WHERE p.verification_status IN ('pending', 'analyzing')
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to reject user with a reason
CREATE OR REPLACE FUNCTION public.admin_reject_user_with_reason(
  user_id uuid,
  reason text
)
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
      verification_reason = reason
  WHERE id = user_id;
  
  -- If instructor, also update instructor details
  UPDATE instructors_details
  SET background_check_status = 'flagged'
  WHERE profile_id = user_id;
END;
$$;

-- Function to approve any user (student or instructor)
CREATE OR REPLACE FUNCTION public.admin_approve_user(user_id uuid)
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
      verification_reason = 'Aprovado pelo administrador.'
  WHERE id = user_id;
  
  -- If instructor, also update instructor details
  UPDATE instructors_details
  SET background_check_status = 'clear'
  WHERE profile_id = user_id;
END;
$$;