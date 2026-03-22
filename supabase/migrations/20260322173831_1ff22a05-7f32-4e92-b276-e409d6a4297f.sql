
-- Remove user-facing INSERT policy on audit_logs to prevent fabrication
DROP POLICY IF EXISTS "Authenticated can insert own audit logs" ON public.audit_logs;

-- Only service_role and security definer functions can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);
