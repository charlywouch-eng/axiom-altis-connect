
-- Fix: restrict insert to service role only (drop overly permissive policy)
DROP POLICY "Service can insert notifications" ON public.notifications;

-- Only allow inserts via service_role (edge functions) or admins
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);
