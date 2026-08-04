CREATE TABLE public.car_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text,
  date date NOT NULL DEFAULT current_date,
  cost numeric NOT NULL DEFAULT 0,
  km integer,
  next_km integer,
  next_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_maintenance TO authenticated;
GRANT ALL ON public.car_maintenance TO service_role;

ALTER TABLE public.car_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their maintenance records"
ON public.car_maintenance FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create maintenance records"
ON public.car_maintenance FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.cars c WHERE c.id = car_id AND c.owner_id = auth.uid()));

CREATE POLICY "Owners can update their maintenance records"
ON public.car_maintenance FOR UPDATE TO authenticated
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their maintenance records"
ON public.car_maintenance FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

CREATE TRIGGER update_car_maintenance_updated_at
BEFORE UPDATE ON public.car_maintenance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();