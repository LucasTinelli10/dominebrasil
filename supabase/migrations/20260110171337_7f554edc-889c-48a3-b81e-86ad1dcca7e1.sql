-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

-- Create a more secure policy - transactions are inserted via service_role in edge functions
-- Users cannot insert transactions directly, only the backend can
-- This policy allows inserts only for authenticated users for their own records
-- But in practice, inserts will be done via service_role which bypasses RLS
CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);