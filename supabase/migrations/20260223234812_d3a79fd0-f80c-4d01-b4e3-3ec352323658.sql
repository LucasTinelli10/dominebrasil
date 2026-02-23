
-- Function to start a lesson (instructor only)
CREATE OR REPLACE FUNCTION public.start_lesson(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  UPDATE bookings SET status = 'in_progress', updated_at = now()
  WHERE id = p_booking_id;
END;
$$;

-- Function to complete a lesson with feedback and balance credit
CREATE OR REPLACE FUNCTION public.complete_lesson(
  p_booking_id uuid,
  p_rating integer DEFAULT NULL,
  p_feedback text DEFAULT NULL,
  p_strengths text[] DEFAULT NULL,
  p_areas_to_improve text[] DEFAULT NULL
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
BEGIN
  -- Get booking and verify instructor
  SELECT * INTO v_booking FROM bookings 
  WHERE id = p_booking_id 
  AND instructor_id = auth.uid() 
  AND status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not in progress';
  END IF;

  -- Calculate amounts (platform takes 15%)
  v_platform_fee := v_booking.total_price * 0.15;
  v_net_amount := v_booking.total_price - v_platform_fee;

  -- Update booking status
  UPDATE bookings SET status = 'completed', updated_at = now()
  WHERE id = p_booking_id;

  -- Insert feedback if provided
  IF p_rating IS NOT NULL THEN
    INSERT INTO lesson_feedback (booking_id, instructor_id, student_id, rating, feedback, strengths, areas_to_improve)
    VALUES (p_booking_id, auth.uid(), v_booking.student_id, p_rating, p_feedback, p_strengths, p_areas_to_improve);
  END IF;

  -- Credit instructor balance
  UPDATE profiles 
  SET balance = COALESCE(balance, 0) + v_net_amount,
      updated_at = now()
  WHERE id = auth.uid();

  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount, reference_id, description, status)
  VALUES (
    auth.uid(), 
    'lesson_payment', 
    v_net_amount, 
    p_booking_id, 
    'Pagamento aula - ' || v_booking.date::text,
    'completed'
  );

  -- Update instructor total_lessons
  UPDATE instructors_details 
  SET total_lessons = COALESCE(total_lessons, 0) + 1
  WHERE profile_id = auth.uid();
END;
$$;
