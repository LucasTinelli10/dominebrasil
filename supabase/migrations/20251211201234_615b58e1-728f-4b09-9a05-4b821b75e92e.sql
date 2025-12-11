-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'instructor', 'investor');

-- Create enum for profile status
CREATE TYPE public.profile_status AS ENUM ('pending', 'approved');

-- Create enum for transmission type
CREATE TYPE public.transmission_type AS ENUM ('manual', 'auto');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  city TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  status profile_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create instructors_details table
CREATE TABLE public.instructors_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  badges TEXT[] DEFAULT '{}',
  price_per_hour NUMERIC DEFAULT 80,
  years_experience INTEGER DEFAULT 1,
  rating NUMERIC DEFAULT 5.0,
  total_lessons INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  plate TEXT NOT NULL,
  image_url TEXT,
  price_per_hour NUMERIC DEFAULT 30,
  transmission transmission_type DEFAULT 'auto',
  location_hub TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status booking_status DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Instructors details policies
CREATE POLICY "Anyone can view instructor details"
  ON public.instructors_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can update own details"
  ON public.instructors_details FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Instructors can insert own details"
  ON public.instructors_details FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Cars policies
CREATE POLICY "Anyone can view available cars"
  ON public.cars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Investors can manage own cars"
  ON public.cars FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR instructor_id = auth.uid());

CREATE POLICY "Students can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update booking"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() OR instructor_id = auth.uid());

-- Create function to handle new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'student')
  );
  
  -- If instructor, create instructor details
  IF (NEW.raw_user_meta_data ->> 'role') = 'instructor' THEN
    INSERT INTO public.instructors_details (profile_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();