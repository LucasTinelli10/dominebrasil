
-- Fix the trigger to allow SECURITY DEFINER functions to modify balance
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow changes from SECURITY DEFINER functions (session_user will be the DB role, not the app user)
  -- In SECURITY DEFINER context, current_user is the function owner
  IF current_user = 'postgres' OR current_user = 'supabase_admin' THEN
    RETURN NEW;
  END IF;

  -- Check if balance is being changed by a non-admin user
  IF NEW.balance IS DISTINCT FROM OLD.balance AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Balance cannot be modified by users';
  END IF;
  
  -- Check if fraud_score is being changed by a non-admin user
  IF NEW.fraud_score IS DISTINCT FROM OLD.fraud_score AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Fraud score cannot be modified by users';
  END IF;
  
  -- Check if verification_status is being changed by a non-admin user
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Verification status cannot be modified by users';
  END IF;
  
  RETURN NEW;
END;
$function$;
