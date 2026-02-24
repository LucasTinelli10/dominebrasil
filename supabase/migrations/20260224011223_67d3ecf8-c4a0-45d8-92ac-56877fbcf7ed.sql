-- Drop the OLD overload (5 params, no code/lat/lng)
DROP FUNCTION IF EXISTS public.complete_lesson(uuid, integer, text, text[], text[]);
