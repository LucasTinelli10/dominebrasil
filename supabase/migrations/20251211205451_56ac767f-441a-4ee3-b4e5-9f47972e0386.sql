-- Create app_role enum if not exists (may already exist)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'instructor', 'investor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'analyzing', 'approved', 'rejected');

-- Create car_rental_status enum
CREATE TYPE public.car_rental_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS fraud_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_reason text;

-- Remove role column from profiles (roles now in user_roles table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Add new columns to instructors_details
ALTER TABLE public.instructors_details
ADD COLUMN IF NOT EXISTS cnh_number text UNIQUE,
ADD COLUMN IF NOT EXISTS cnh_category text,
ADD COLUMN IF NOT EXISTS cnh_expiry_date date,
ADD COLUMN IF NOT EXISTS credential_number text,
ADD COLUMN IF NOT EXISTS documents_url jsonb DEFAULT '{}';

-- Create car_rentals table
CREATE TABLE public.car_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time_slot text NOT NULL,
  status car_rental_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.car_rentals ENABLE ROW LEVEL SECURITY;

-- RLS for car_rentals
CREATE POLICY "Instructors can view own rentals"
ON public.car_rentals FOR SELECT
USING (instructor_id = auth.uid());

CREATE POLICY "Car owners can view rentals of their cars"
ON public.car_rentals FOR SELECT
USING (car_id IN (SELECT id FROM public.cars WHERE owner_id = auth.uid()));

CREATE POLICY "Instructors can create rentals"
ON public.car_rentals FOR INSERT
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update own rentals"
ON public.car_rentals FOR UPDATE
USING (instructor_id = auth.uid());

-- Update handle_new_user function to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to student
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'student');
  
  -- Insert into profiles without role column
  INSERT INTO public.profiles (id, full_name, verification_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN user_role = 'instructor' THEN 'pending'::verification_status ELSE 'approved'::verification_status END
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If instructor, create instructor details
  IF user_role = 'instructor' THEN
    INSERT INTO public.instructors_details (profile_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to check availability for smart agenda
CREATE OR REPLACE FUNCTION public.check_availability(
  instr_id uuid,
  check_date date,
  check_time text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if instructor has a booking at that time
  IF EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE instructor_id = instr_id 
    AND date = check_date 
    AND time_slot = check_time 
    AND status NOT IN ('cancelled')
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if instructor has a car rental at that time
  IF EXISTS (
    SELECT 1 FROM public.car_rentals 
    WHERE instructor_id = instr_id 
    AND date = check_date 
    AND time_slot = check_time 
    AND status NOT IN ('cancelled')
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;