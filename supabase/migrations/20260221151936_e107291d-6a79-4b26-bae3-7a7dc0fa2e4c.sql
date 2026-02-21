-- Allow users to view profiles of people they have exchanged messages with
CREATE POLICY "Users can view profiles of message participants"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    id IN (
      SELECT sender_id FROM public.messages WHERE receiver_id = auth.uid()
      UNION
      SELECT receiver_id FROM public.messages WHERE sender_id = auth.uid()
    )
  )
);