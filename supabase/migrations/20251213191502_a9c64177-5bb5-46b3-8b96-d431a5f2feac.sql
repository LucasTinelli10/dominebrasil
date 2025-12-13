-- =====================================================
-- COMPREHENSIVE SECURITY FIX: ALL RLS POLICIES
-- =====================================================

-- 1. FIX USER_ROLES TABLE: Remove public access, only users can see own roles
-- Drop existing policies if any that allow public access
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. FIX PROFILES TABLE: Create secure view function, restrict direct access
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated can view approved instructor basic profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate secure policies for profiles
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles for verification
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 3. FIX INSTRUCTORS_DETAILS TABLE: Only owners and admins
DROP POLICY IF EXISTS "Instructors can view own complete details" ON instructors_details;
DROP POLICY IF EXISTS "Instructors can insert own details" ON instructors_details;
DROP POLICY IF EXISTS "Instructors can update own details" ON instructors_details;

CREATE POLICY "Instructors can view own details"
ON instructors_details FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Instructors can insert own details"
ON instructors_details FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Instructors can update own details"
ON instructors_details FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

-- Admins can view instructor details for verification
CREATE POLICY "Admins can view instructor details"
ON instructors_details FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 4. FIX CARS TABLE: Only owners can manage, authenticated can view approved cars
DROP POLICY IF EXISTS "Investors can manage own cars" ON cars;
DROP POLICY IF EXISTS "Owners can view own cars" ON cars;

-- Car owners can fully manage their own cars
CREATE POLICY "Car owners can manage own cars"
ON cars FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Authenticated users can view approved and available cars (for booking)
CREATE POLICY "Authenticated can view available approved cars"
ON cars FOR SELECT
TO authenticated
USING (
  available = true 
  AND verification_status = 'approved'
);

-- Admins can view all cars
CREATE POLICY "Admins can view all cars"
ON cars FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 5. FIX BOOKINGS TABLE: Only participants can see their bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
DROP POLICY IF EXISTS "Participants can update booking" ON bookings;

CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR instructor_id = auth.uid());

CREATE POLICY "Students can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update bookings"
ON bookings FOR UPDATE
TO authenticated
USING (student_id = auth.uid() OR instructor_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6. FIX CAR_RENTALS TABLE: Only instructors and car owners
DROP POLICY IF EXISTS "Instructors can view own rentals" ON car_rentals;
DROP POLICY IF EXISTS "Instructors can create rentals" ON car_rentals;
DROP POLICY IF EXISTS "Instructors can update own rentals" ON car_rentals;
DROP POLICY IF EXISTS "Car owners can view rentals of their cars" ON car_rentals;

CREATE POLICY "Instructors can view own rentals"
ON car_rentals FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create rentals"
ON car_rentals FOR INSERT
TO authenticated
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update own rentals"
ON car_rentals FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Car owners can view rentals of their cars"
ON car_rentals FOR SELECT
TO authenticated
USING (
  car_id IN (
    SELECT id FROM cars WHERE owner_id = auth.uid()
  )
);

-- Admins can view all car rentals
CREATE POLICY "Admins can view all car_rentals"
ON car_rentals FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));