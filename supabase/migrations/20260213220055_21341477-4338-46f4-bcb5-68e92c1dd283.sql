
-- Table des métiers MINEFOP ↔ ROME
CREATE TABLE public.metiers_minefop_rome (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minefop_title TEXT NOT NULL,
  rome_code TEXT NOT NULL,
  rome_title TEXT NOT NULL,
  description TEXT NOT NULL,
  competences TEXT[] NOT NULL DEFAULT '{}',
  niveau TEXT NOT NULL,
  legalisation TEXT NOT NULL,
  salaire_moyen_france TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public read access (landing page, detail pages)
ALTER TABLE public.metiers_minefop_rome ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view metiers"
  ON public.metiers_minefop_rome
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage metiers"
  ON public.metiers_minefop_rome
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
