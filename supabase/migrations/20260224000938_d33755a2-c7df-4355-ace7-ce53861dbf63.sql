
-- Fix overly permissive INSERT policy - only allow inserts via SECURITY DEFINER functions
DROP POLICY "System can insert verifications" ON public.lesson_verifications;

CREATE POLICY "No direct inserts"
ON public.lesson_verifications FOR INSERT
WITH CHECK (false);
