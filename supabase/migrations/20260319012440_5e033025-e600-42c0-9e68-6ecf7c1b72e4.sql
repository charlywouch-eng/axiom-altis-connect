
-- Add email notification preference to talent_profiles
ALTER TABLE public.talent_profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;

-- Create notification log for anti-spam (max 1/day/talent)
CREATE TABLE public.talent_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_user_id uuid NOT NULL,
  notification_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_notification_log_talent_type_date 
ON public.talent_notification_log (talent_user_id, notification_type, created_at DESC);

-- RLS
ALTER TABLE public.talent_notification_log ENABLE ROW LEVEL SECURITY;

-- Only service role / admins can insert/read (edge function uses service role)
CREATE POLICY "Admins can manage notification log"
ON public.talent_notification_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role insert (no RLS bypass needed - service role bypasses RLS)
