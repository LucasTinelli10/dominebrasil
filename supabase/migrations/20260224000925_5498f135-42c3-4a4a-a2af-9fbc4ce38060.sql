
-- Table to store lesson verification codes
CREATE TABLE public.lesson_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('start', 'finish')),
  instructor_lat numeric,
  instructor_lng numeric,
  student_lat numeric,
  student_lng numeric,
  distance_meters numeric,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.lesson_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view verifications for their bookings"
ON public.lesson_verifications FOR SELECT
USING (booking_id IN (SELECT id FROM bookings WHERE instructor_id = auth.uid()));

CREATE POLICY "Students can view verifications for their bookings"
ON public.lesson_verifications FOR SELECT
USING (booking_id IN (SELECT id FROM bookings WHERE student_id = auth.uid()));

CREATE POLICY "System can insert verifications"
ON public.lesson_verifications FOR INSERT
WITH CHECK (true);

-- Function to generate a 4-digit code for lesson verification (called by student)
CREATE OR REPLACE FUNCTION public.generate_lesson_code(p_booking_id uuid, p_type text, p_lat numeric DEFAULT NULL, p_lng numeric DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
BEGIN
  -- Verify the student owns this booking
  IF NOT EXISTS (
    SELECT 1 FROM bookings WHERE id = p_booking_id AND student_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Generate random 4-digit code
  v_code := lpad(floor(random() * 10000)::text, 4, '0');

  -- Delete any existing codes for this booking and type
  DELETE FROM lesson_verifications WHERE booking_id = p_booking_id AND type = p_type AND verified = false;

  -- Insert new code (expires in 5 minutes)
  INSERT INTO lesson_verifications (booking_id, code, type, student_lat, student_lng, expires_at)
  VALUES (p_booking_id, v_code, p_type, p_lat, p_lng, now() + interval '5 minutes');

  RETURN v_code;
END;
$$;

-- Updated start_lesson with GPS + code verification
CREATE OR REPLACE FUNCTION public.start_lesson(p_booking_id uuid, p_code text DEFAULT NULL, p_lat numeric DEFAULT NULL, p_lng numeric DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_verification lesson_verifications%ROWTYPE;
  v_distance numeric;
BEGIN
  -- Verify the instructor owns this booking and it's confirmed
  IF NOT EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = p_booking_id 
    AND instructor_id = auth.uid() 
    AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'Booking not found or not in confirmed status';
  END IF;

  -- Verify code if provided
  IF p_code IS NOT NULL THEN
    SELECT * INTO v_verification FROM lesson_verifications
    WHERE booking_id = p_booking_id AND type = 'start' AND code = p_code AND verified = false AND expires_at > now();
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Código inválido ou expirado';
    END IF;

    -- Calculate distance if GPS data available
    IF p_lat IS NOT NULL AND v_verification.student_lat IS NOT NULL THEN
      v_distance := 111320 * sqrt(
        power(p_lat - v_verification.student_lat, 2) + 
        power((p_lng - v_verification.student_lng) * cos(radians(p_lat)), 2)
      );
      
      IF v_distance > 500 THEN
        RAISE EXCEPTION 'Distância entre instrutor e aluno muito grande (%.0fm). Máximo: 500m', v_distance;
      END IF;
    END IF;

    -- Mark as verified and store instructor GPS
    UPDATE lesson_verifications 
    SET verified = true, instructor_lat = p_lat, instructor_lng = p_lng, distance_meters = v_distance
    WHERE id = v_verification.id;
  END IF;

  UPDATE bookings SET status = 'in_progress', updated_at = now()
  WHERE id = p_booking_id;
END;
$$;

-- Updated complete_lesson with GPS + code verification
CREATE OR REPLACE FUNCTION public.complete_lesson(
  p_booking_id uuid,
  p_rating integer DEFAULT NULL,
  p_feedback text DEFAULT NULL,
  p_strengths text[] DEFAULT NULL,
  p_areas_to_improve text[] DEFAULT NULL,
  p_code text DEFAULT NULL,
  p_lat numeric DEFAULT NULL,
  p_lng numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_net_amount numeric;
  v_platform_fee numeric;
  v_verification lesson_verifications%ROWTYPE;
  v_distance numeric;
BEGIN
  SELECT * INTO v_booking FROM bookings 
  WHERE id = p_booking_id 
  AND instructor_id = auth.uid() 
  AND status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not in progress';
  END IF;

  -- Verify code if provided
  IF p_code IS NOT NULL THEN
    SELECT * INTO v_verification FROM lesson_verifications
    WHERE booking_id = p_booking_id AND type = 'finish' AND code = p_code AND verified = false AND expires_at > now();
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Código inválido ou expirado';
    END IF;

    IF p_lat IS NOT NULL AND v_verification.student_lat IS NOT NULL THEN
      v_distance := 111320 * sqrt(
        power(p_lat - v_verification.student_lat, 2) + 
        power((p_lng - v_verification.student_lng) * cos(radians(p_lat)), 2)
      );
      
      IF v_distance > 500 THEN
        RAISE EXCEPTION 'Distância entre instrutor e aluno muito grande (%.0fm). Máximo: 500m', v_distance;
      END IF;
    END IF;

    UPDATE lesson_verifications 
    SET verified = true, instructor_lat = p_lat, instructor_lng = p_lng, distance_meters = v_distance
    WHERE id = v_verification.id;
  END IF;

  v_platform_fee := v_booking.total_price * 0.15;
  v_net_amount := v_booking.total_price - v_platform_fee;

  UPDATE bookings SET status = 'completed', updated_at = now()
  WHERE id = p_booking_id;

  IF p_rating IS NOT NULL THEN
    INSERT INTO lesson_feedback (booking_id, instructor_id, student_id, rating, feedback, strengths, areas_to_improve)
    VALUES (p_booking_id, auth.uid(), v_booking.student_id, p_rating, p_feedback, p_strengths, p_areas_to_improve);
  END IF;

  UPDATE profiles 
  SET balance = COALESCE(balance, 0) + v_net_amount,
      updated_at = now()
  WHERE id = auth.uid();

  INSERT INTO transactions (user_id, type, amount, reference_id, description, status)
  VALUES (
    auth.uid(), 
    'lesson_income', 
    v_net_amount, 
    p_booking_id, 
    'Pagamento aula - ' || v_booking.date::text,
    'completed'
  );

  UPDATE instructors_details 
  SET total_lessons = COALESCE(total_lessons, 0) + 1
  WHERE profile_id = auth.uid();
END;
$$;
