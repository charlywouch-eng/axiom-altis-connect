ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_company_id_idx ON public.leads (company_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'company_profiles'
      AND policyname = 'Admins can view all company profiles'
  ) THEN
    CREATE POLICY "Admins can view all company profiles"
      ON public.company_profiles
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;