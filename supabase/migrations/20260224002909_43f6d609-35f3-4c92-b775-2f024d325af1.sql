
-- Enable realtime for bookings table (for student notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Add failed_attempts tracking to lesson_verifications
ALTER TABLE public.lesson_verifications ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0;

-- Add a blocked_until column for auto-blocking
ALTER TABLE public.lesson_verifications ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone;

-- Create function to track failed verification attempts
CREATE OR REPLACE FUNCTION public.verify_lesson_code(
  p_booking_id uuid,
  p_type text,
  p_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_verification lesson_verifications%ROWTYPE;
BEGIN
  -- Check if there's an active verification for this booking/type
  SELECT * INTO v_verification FROM lesson_verifications
  WHERE booking_id = p_booking_id 
    AND type = p_type 
    AND verified = false 
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum código ativo encontrado. Peça ao aluno para gerar um novo código.';
  END IF;

  -- Check if blocked
  IF v_verification.blocked_until IS NOT NULL AND v_verification.blocked_until > now() THEN
    RAISE EXCEPTION 'Código bloqueado por tentativas incorretas. Peça ao aluno para gerar um novo código.';
  END IF;

  -- Check if code matches
  IF v_verification.code != p_code THEN
    -- Increment failed attempts
    UPDATE lesson_verifications 
    SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
        blocked_until = CASE 
          WHEN COALESCE(failed_attempts, 0) + 1 >= 3 THEN now() + interval '15 minutes'
          ELSE NULL
        END
    WHERE id = v_verification.id;

    IF COALESCE(v_verification.failed_attempts, 0) + 1 >= 3 THEN
      RAISE EXCEPTION 'Código bloqueado após 3 tentativas incorretas. Peça ao aluno para gerar um novo código.';
    END IF;

    RAISE EXCEPTION 'Código incorreto. Tentativa % de 3.', COALESCE(v_verification.failed_attempts, 0) + 1;
  END IF;

  RETURN true;
END;
$$;

-- Update start_lesson to check failed attempts before proceeding
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
    WHERE booking_id = p_booking_id AND type = 'start' AND verified = false AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Nenhum código ativo encontrado. Peça ao aluno para gerar um novo código.';
    END IF;

    -- Check if blocked
    IF v_verification.blocked_until IS NOT NULL AND v_verification.blocked_until > now() THEN
      RAISE EXCEPTION 'Código bloqueado por tentativas incorretas. Peça ao aluno para gerar um novo código.';
    END IF;

    -- Check code
    IF v_verification.code != p_code THEN
      UPDATE lesson_verifications 
      SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
          blocked_until = CASE 
            WHEN COALESCE(failed_attempts, 0) + 1 >= 3 THEN now() + interval '15 minutes'
            ELSE NULL
          END
      WHERE id = v_verification.id;

      IF COALESCE(v_verification.failed_attempts, 0) + 1 >= 3 THEN
        RAISE EXCEPTION 'Código bloqueado após 3 tentativas incorretas. Peça ao aluno para gerar um novo código.';
      END IF;

      RAISE EXCEPTION 'Código incorreto. Tentativa % de 3.', COALESCE(v_verification.failed_attempts, 0) + 1;
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

    -- Mark as verified
    UPDATE lesson_verifications 
    SET verified = true, instructor_lat = p_lat, instructor_lng = p_lng, distance_meters = v_distance
    WHERE id = v_verification.id;
  END IF;

  UPDATE bookings SET status = 'in_progress', updated_at = now()
  WHERE id = p_booking_id;
END;
$$;

-- Update complete_lesson to check failed attempts
CREATE OR REPLACE FUNCTION public.complete_lesson(p_booking_id uuid, p_rating integer DEFAULT NULL, p_feedback text DEFAULT NULL, p_strengths text[] DEFAULT NULL, p_areas_to_improve text[] DEFAULT NULL, p_code text DEFAULT NULL, p_lat numeric DEFAULT NULL, p_lng numeric DEFAULT NULL)
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
    WHERE booking_id = p_booking_id AND type = 'finish' AND verified = false AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Nenhum código ativo encontrado. Peça ao aluno para gerar um novo código.';
    END IF;

    -- Check if blocked
    IF v_verification.blocked_until IS NOT NULL AND v_verification.blocked_until > now() THEN
      RAISE EXCEPTION 'Código bloqueado por tentativas incorretas. Peça ao aluno para gerar um novo código.';
    END IF;

    IF v_verification.code != p_code THEN
      UPDATE lesson_verifications 
      SET failed_attempts = COALESCE(failed_attempts, 0) + 1,
          blocked_until = CASE 
            WHEN COALESCE(failed_attempts, 0) + 1 >= 3 THEN now() + interval '15 minutes'
            ELSE NULL
          END
      WHERE id = v_verification.id;

      IF COALESCE(v_verification.failed_attempts, 0) + 1 >= 3 THEN
        RAISE EXCEPTION 'Código bloqueado após 3 tentativas incorretas. Peça ao aluno para gerar um novo código.';
      END IF;

      RAISE EXCEPTION 'Código incorreto. Tentativa % de 3.', COALESCE(v_verification.failed_attempts, 0) + 1;
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
