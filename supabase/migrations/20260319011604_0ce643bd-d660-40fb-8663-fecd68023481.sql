
CREATE TABLE public.candidatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Section 1: Informations personnelles
  full_name text NOT NULL DEFAULT '',
  phone text,
  city text,
  photo_url text,
  
  -- Section 2: Expérience professionnelle (JSON array)
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Section 3: Formation & Diplômes (JSON array)
  formations jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Section 4: Compétences & Certifications
  competences text[] NOT NULL DEFAULT '{}'::text[],
  certifications text[] NOT NULL DEFAULT '{}'::text[],
  
  -- Section 5: Souhait
  contract_type text,
  mobility text,
  desired_salary text,
  
  -- Metadata
  status text NOT NULL DEFAULT 'submitted',
  compliance_score integer NOT NULL DEFAULT 0
);

ALTER TABLE public.candidatures ENABLE ROW LEVEL SECURITY;

-- Talents can insert their own candidature
CREATE POLICY "Talents can insert own candidature"
ON public.candidatures FOR INSERT TO authenticated
WITH CHECK (auth.uid() = talent_user_id);

-- Talents can view their own candidatures
CREATE POLICY "Talents can view own candidatures"
ON public.candidatures FOR SELECT TO authenticated
USING (auth.uid() = talent_user_id);

-- Talents can update their own candidature
CREATE POLICY "Talents can update own candidature"
ON public.candidatures FOR UPDATE TO authenticated
USING (auth.uid() = talent_user_id)
WITH CHECK (auth.uid() = talent_user_id);

-- Admins full access
CREATE POLICY "Admins full access candidatures"
ON public.candidatures FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscribed entreprises can view submitted candidatures
CREATE POLICY "Entreprises can view candidatures"
ON public.candidatures FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'entreprise'::app_role) 
  AND is_enterprise_subscribed(auth.uid())
  AND status = 'submitted'
);

-- Recruteurs can view submitted candidatures
CREATE POLICY "Recruteurs can view candidatures"
ON public.candidatures FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'recruteur'::app_role)
  AND status = 'submitted'
);

-- Updated_at trigger
CREATE TRIGGER update_candidatures_updated_at
BEFORE UPDATE ON public.candidatures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
