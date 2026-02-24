
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
  SELECT * INTO v_booking FROM bookings 
  WHERE id = p_booking_id 
  AND instructor_id = auth.uid() 
  AND status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not in progress';
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
