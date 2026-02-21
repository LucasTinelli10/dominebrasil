-- Allow instructors to view profiles of students who have bookings with them
CREATE POLICY "Instructors can view profiles of their students"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND id IN (
    SELECT b.student_id FROM public.bookings b WHERE b.instructor_id = auth.uid()
  )
);