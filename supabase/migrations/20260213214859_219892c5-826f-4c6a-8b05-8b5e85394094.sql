
-- Create storage bucket for diplomas
INSERT INTO storage.buckets (id, name, public)
VALUES ('diplomas', 'diplomas', false);

-- Storage policies: talents upload their own files, admins/entreprises can read
CREATE POLICY "Talents can upload own diplomas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'diplomas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Talents can view own diplomas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'diplomas'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'entreprise')
  )
);

CREATE POLICY "Talents can delete own diplomas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'diplomas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create diplomas table
CREATE TABLE public.diplomas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id uuid NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  
  -- OCR extracted data
  extracted_name text,
  extracted_date text,
  extracted_field text,
  
  -- Verification results
  minfop_verified boolean DEFAULT false,
  apostille_verified boolean DEFAULT false,
  rome_code text,
  rome_label text,
  rome_match_percent integer DEFAULT 0,
  
  -- Overall status
  status text NOT NULL DEFAULT 'en_attente',
  verification_details jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diplomas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Talents can view own diplomas"
ON public.diplomas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Talents can insert own diplomas"
ON public.diplomas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Talents can update own diplomas"
ON public.diplomas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all diplomas"
ON public.diplomas FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all diplomas"
ON public.diplomas FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Entreprises can view verified diplomas"
ON public.diplomas FOR SELECT
USING (
  public.has_role(auth.uid(), 'entreprise')
  AND status = 'verifie'
);

-- Trigger for updated_at
CREATE TRIGGER update_diplomas_updated_at
BEFORE UPDATE ON public.diplomas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.diplomas;
