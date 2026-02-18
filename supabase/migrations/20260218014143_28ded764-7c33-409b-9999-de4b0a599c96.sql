
CREATE TABLE public.company_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL DEFAULT '',
  sector text,
  siret text,
  contact_email text,
  contact_phone text,
  address text,
  website text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own profile"
  ON public.company_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own profile"
  ON public.company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can update own profile"
  ON public.company_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all company profiles"
  ON public.company_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Companies can upload own logo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Company logos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Companies can update own logo"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Companies can delete own logo"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
