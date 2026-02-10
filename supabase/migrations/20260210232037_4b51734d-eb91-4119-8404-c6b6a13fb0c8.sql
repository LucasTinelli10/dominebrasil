
-- Add is_vehicle_owner to instructors_details
ALTER TABLE public.instructors_details 
ADD COLUMN IF NOT EXISTS is_vehicle_owner boolean NOT NULL DEFAULT false;

-- Create instructor_packages table
CREATE TABLE public.instructor_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price > 0),
  lesson_count INTEGER NOT NULL CHECK (lesson_count > 0),
  includes_exam BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_packages ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own packages
CREATE POLICY "Instructors can view own packages"
ON public.instructor_packages
FOR SELECT
USING (instructor_id = auth.uid());

-- Instructors can create their own packages
CREATE POLICY "Instructors can create own packages"
ON public.instructor_packages
FOR INSERT
WITH CHECK (instructor_id = auth.uid());

-- Instructors can update their own packages
CREATE POLICY "Instructors can update own packages"
ON public.instructor_packages
FOR UPDATE
USING (instructor_id = auth.uid());

-- Instructors can delete their own packages
CREATE POLICY "Instructors can delete own packages"
ON public.instructor_packages
FOR DELETE
USING (instructor_id = auth.uid());

-- Anyone authenticated can view active packages (for students browsing)
CREATE POLICY "Authenticated users can view active packages"
ON public.instructor_packages
FOR SELECT
USING (active = true);

-- Admins can view all packages
CREATE POLICY "Admins can view all packages"
ON public.instructor_packages
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_instructor_packages_updated_at
BEFORE UPDATE ON public.instructor_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to get packages for a given instructor (public access)
CREATE OR REPLACE FUNCTION public.get_instructor_packages(p_instructor_id UUID)
RETURNS TABLE(
  id UUID,
  instructor_id UUID,
  name TEXT,
  price NUMERIC,
  lesson_count INTEGER,
  includes_exam BOOLEAN,
  active BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ip.id,
    ip.instructor_id,
    ip.name,
    ip.price,
    ip.lesson_count,
    ip.includes_exam,
    ip.active
  FROM public.instructor_packages ip
  INNER JOIN public.profiles p ON p.id = ip.instructor_id
  WHERE ip.instructor_id = p_instructor_id
    AND ip.active = true
    AND p.verification_status = 'approved';
$$;
