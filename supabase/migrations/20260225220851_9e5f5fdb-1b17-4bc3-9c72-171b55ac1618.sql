
-- Analytics funnel events table
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  rome_code TEXT,
  experience TEXT,
  email_hash TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast querying by event and date
CREATE INDEX idx_funnel_events_name_date ON public.funnel_events (event_name, created_at DESC);
CREATE INDEX idx_funnel_events_rome ON public.funnel_events (rome_code);

-- Enable RLS but allow inserts from anon (public funnel tracking)
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (public funnel pages)
CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events FOR INSERT
  WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Admins can read funnel events"
  ON public.funnel_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
