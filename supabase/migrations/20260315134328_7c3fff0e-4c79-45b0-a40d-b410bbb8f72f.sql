
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 1. Revoke EXECUTE on has_role from anon to prevent UUID enumeration
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- 2. Harden talent_update_rls_check: reject if caller is not the owner
CREATE OR REPLACE FUNCTION public.talent_update_rls_check(
  _user_id uuid, _is_premium boolean, _compliance_score integer,
  _visa_status text, _score numeric, _premium_unlocked_at timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _user_id = auth.uid()
    AND _is_premium = (SELECT tp.is_premium FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _compliance_score = (SELECT tp.compliance_score FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _visa_status = (SELECT tp.visa_status FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _score IS NOT DISTINCT FROM (SELECT tp.score FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _premium_unlocked_at IS NOT DISTINCT FROM (SELECT tp.premium_unlocked_at FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
$$;

-- 3. Harden company_update_rls_check: reject if caller is not the owner
CREATE OR REPLACE FUNCTION public.company_update_rls_check(
  _user_id uuid, _is_subscribed boolean, _subscription_end timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _user_id = auth.uid()
    AND _is_subscribed = (SELECT cp.is_subscribed FROM public.company_profiles cp WHERE cp.user_id = _user_id)
    AND _subscription_end IS NOT DISTINCT FROM (SELECT cp.subscription_end FROM public.company_profiles cp WHERE cp.user_id = _user_id)
$$;

-- 4. Revoke direct execute on sensitive functions from anon
REVOKE EXECUTE ON FUNCTION public.talent_update_rls_check(uuid, boolean, integer, text, numeric, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.company_update_rls_check(uuid, boolean, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;

-- 5. Admin alert trigger on audit_logs
CREATE OR REPLACE FUNCTION public.notify_admin_on_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base_url text := 'https://wfolueffkdzknuowwecf.supabase.co/functions/v1/send-notification';
  _anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmb2x1ZWZma2R6a251b3d3ZWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjcwMjYsImV4cCI6MjA4NjUwMzAyNn0.e4x6gC6N852G2XsFahUFWmcUamymxv9Sd7jRS14bJ6Y';
BEGIN
  PERFORM net.http_post(
    url := _base_url,
    body := jsonb_build_object(
      'type', 'security_alert',
      'payload', jsonb_build_object(
        'user_id', NEW.user_id,
        'action', NEW.action,
        'details', NEW.details,
        'created_at', NEW.created_at
      )
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_audit
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_audit();
