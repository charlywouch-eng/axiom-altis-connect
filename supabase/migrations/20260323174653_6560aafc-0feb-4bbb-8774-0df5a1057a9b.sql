
-- Shortlist table for recruiters
CREATE TABLE public.talent_shortlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  talent_profile_id uuid NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (recruiter_id, talent_profile_id)
);

ALTER TABLE public.talent_shortlist ENABLE ROW LEVEL SECURITY;

-- Recruiters and entreprises can manage their own shortlist
CREATE POLICY "Users can view own shortlist"
  ON public.talent_shortlist FOR SELECT
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Users can insert own shortlist"
  ON public.talent_shortlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND (has_role(auth.uid(), 'recruteur') OR has_role(auth.uid(), 'entreprise')));

CREATE POLICY "Users can delete own shortlist"
  ON public.talent_shortlist FOR DELETE
  TO authenticated
  USING (auth.uid() = recruiter_id);

-- Admins full access
CREATE POLICY "Admins full access shortlist"
  ON public.talent_shortlist FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
