-- Create a trigger function to protect balance and fraud_score from user modification
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on the profiles table
DROP TRIGGER IF EXISTS protect_profile_sensitive_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_sensitive_profile_fields();