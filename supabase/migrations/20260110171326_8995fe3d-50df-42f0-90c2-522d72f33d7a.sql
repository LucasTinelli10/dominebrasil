-- Create transactions table for financial tracking
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lesson_income', 'platform_fee', 'car_rental_fee', 'withdrawal', 'withdrawal_fee')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create withdrawals table for instructor payout requests
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  pix_key TEXT NOT NULL,
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'instant')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Add financial columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_pending NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_withdrawn NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Enable RLS on new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

-- RLS Policies for withdrawals
CREATE POLICY "Instructors can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can create their own withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (auth.uid() = instructor_id);

-- Create index for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_withdrawals_instructor_id ON public.withdrawals(instructor_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);