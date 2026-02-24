-- Allow admins to view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to update withdrawals (mark as paid/rejected)
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawals
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Allow admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to update profiles (for balance refund on rejection)
-- Already exists via is_admin check in trigger, but we need UPDATE policy
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin(auth.uid()));