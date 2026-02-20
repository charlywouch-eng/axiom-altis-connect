
-- ── Table leads ─────────────────────────────────────────────────
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_or_phone TEXT NOT NULL,
  metier TEXT NOT NULL,
  rome_code TEXT NOT NULL DEFAULT '',
  experience_bracket TEXT NOT NULL DEFAULT '',
  score_mock INTEGER NOT NULL DEFAULT 0,
  rgpd_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'a_contacter',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can INSERT a lead if they consented to RGPD
CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (rgpd_consent = true);

-- Only admins can SELECT
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can UPDATE (change status, add notes)
CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can DELETE
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
