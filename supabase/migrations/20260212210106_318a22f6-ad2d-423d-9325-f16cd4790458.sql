-- Create job_offers table
CREATE TABLE public.job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  salary_range TEXT,
  location TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  company_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

-- Companies can view their own offers
CREATE POLICY "Companies can view their own offers"
  ON public.job_offers
  FOR SELECT
  USING (auth.uid() = company_id);

-- Companies can create offers
CREATE POLICY "Companies can create offers"
  ON public.job_offers
  FOR INSERT
  WITH CHECK (auth.uid() = company_id);

-- Companies can update their own offers
CREATE POLICY "Companies can update their own offers"
  ON public.job_offers
  FOR UPDATE
  USING (auth.uid() = company_id);

-- Companies can delete their own offers
CREATE POLICY "Companies can delete their own offers"
  ON public.job_offers
  FOR DELETE
  USING (auth.uid() = company_id);

-- Admins can view all offers
CREATE POLICY "Admins can view all offers"
  ON public.job_offers
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_job_offers_updated_at
  BEFORE UPDATE ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();