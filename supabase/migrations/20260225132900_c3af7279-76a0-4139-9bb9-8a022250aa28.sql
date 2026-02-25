
-- Table to persist quote requests from enterprises
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  company TEXT NOT NULL,
  sector TEXT NOT NULL,
  volume TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'nouveau',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Admins can read all quote requests
CREATE POLICY "Admins can view all quote requests"
  ON public.quote_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Admins can update quote requests (status, notes)
CREATE POLICY "Admins can update quote requests"
  ON public.quote_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Service role inserts (from edge function) bypass RLS, but also allow authenticated users to insert their own
CREATE POLICY "Users can insert their own quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
