-- Remove the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view available cars" ON public.cars;

-- Policy: Car owners can view their own cars with all details
CREATE POLICY "Owners can view own cars"
ON public.cars
FOR SELECT
USING (owner_id = auth.uid());

-- Policy: Authenticated users can view available approved cars (for rental browsing)
-- This still shows all columns to authenticated users, but we'll use a function for public access
CREATE POLICY "Authenticated users can view available approved cars"
ON public.cars
FOR SELECT
TO authenticated
USING (
  available = true 
  AND verification_status = 'approved'
);

-- Create a secure function that returns ONLY public car data (no sensitive fields)
CREATE OR REPLACE FUNCTION public.get_available_cars()
RETURNS TABLE (
  id uuid,
  model text,
  plate text,
  transmission transmission_type,
  price_per_hour numeric,
  available boolean,
  image_url text,
  photo_exterior_front text,
  photo_exterior_side text,
  location_hub text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.model,
    c.plate,
    c.transmission,
    c.price_per_hour,
    c.available,
    c.image_url,
    c.photo_exterior_front,
    c.photo_exterior_side,
    c.location_hub
  FROM public.cars c
  WHERE c.available = true
    AND c.verification_status = 'approved';
$$;

-- Function to get a single car's public details
CREATE OR REPLACE FUNCTION public.get_car_public_details(car_id uuid)
RETURNS TABLE (
  id uuid,
  model text,
  plate text,
  transmission transmission_type,
  price_per_hour numeric,
  available boolean,
  image_url text,
  photo_exterior_front text,
  photo_exterior_side text,
  location_hub text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.model,
    c.plate,
    c.transmission,
    c.price_per_hour,
    c.available,
    c.image_url,
    c.photo_exterior_front,
    c.photo_exterior_side,
    c.location_hub
  FROM public.cars c
  WHERE c.id = car_id
    AND c.available = true
    AND c.verification_status = 'approved';
$$;