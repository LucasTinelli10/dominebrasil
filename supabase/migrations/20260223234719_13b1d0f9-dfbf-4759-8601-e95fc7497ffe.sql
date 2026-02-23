
-- Add 'in_progress' to booking_status enum
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'confirmed';
