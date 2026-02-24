
-- Table to track archived conversations per user
CREATE TABLE public.archived_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, participant_id)
);

ALTER TABLE public.archived_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archived conversations"
ON public.archived_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can archive conversations"
ON public.archived_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unarchive conversations"
ON public.archived_conversations FOR DELETE
USING (auth.uid() = user_id);
