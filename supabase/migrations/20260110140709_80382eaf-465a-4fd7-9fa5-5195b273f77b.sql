-- Create table for instructor schedule blocks
CREATE TABLE public.instructor_schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own blocks
CREATE POLICY "Instructors can view their own schedule blocks" 
ON public.instructor_schedule_blocks 
FOR SELECT 
USING (auth.uid() = instructor_id);

-- Instructors can create their own blocks
CREATE POLICY "Instructors can create their own schedule blocks" 
ON public.instructor_schedule_blocks 
FOR INSERT 
WITH CHECK (auth.uid() = instructor_id);

-- Instructors can delete their own blocks
CREATE POLICY "Instructors can delete their own schedule blocks" 
ON public.instructor_schedule_blocks 
FOR DELETE 
USING (auth.uid() = instructor_id);

-- Create index for performance
CREATE INDEX idx_instructor_schedule_blocks_lookup 
ON public.instructor_schedule_blocks(instructor_id, date, time_slot);

-- Update check_availability function to also check instructor blocks
CREATE OR REPLACE FUNCTION public.check_availability(check_date text, check_time text, instr_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if instructor has a confirmed or pending booking at this time
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE instructor_id = instr_id 
    AND date = check_date::date 
    AND time_slot = check_time 
    AND status IN ('confirmed', 'pending')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check if instructor has blocked this time slot
  IF EXISTS (
    SELECT 1 FROM instructor_schedule_blocks 
    WHERE instructor_id = instr_id 
    AND date = check_date::date 
    AND time_slot = check_time
  ) THEN
    RETURN FALSE;
  END IF;

  -- Available
  RETURN TRUE;
END;
$$;