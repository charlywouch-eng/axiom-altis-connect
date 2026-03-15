
CREATE TABLE public.generated_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quote_number text NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_email text NOT NULL,
  sector text,
  volume text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_ht numeric NOT NULL DEFAULT 0,
  total_ttc numeric NOT NULL DEFAULT 0,
  validity_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  pdf_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes" ON public.generated_quotes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON public.generated_quotes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quotes" ON public.generated_quotes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all quotes" ON public.generated_quotes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_generated_quotes_updated_at
  BEFORE UPDATE ON public.generated_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE SEQUENCE public.quote_number_seq START 1001;
