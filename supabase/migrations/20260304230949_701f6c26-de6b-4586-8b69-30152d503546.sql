
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- ═══ Function: notify on visa_status change ═══════════════════
CREATE OR REPLACE FUNCTION public.notify_visa_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text := current_setting('app.settings.supabase_url', true);
  _service_key text := current_setting('app.settings.service_role_key', true);
BEGIN
  -- Only fire when visa_status actually changes
  IF OLD.visa_status IS DISTINCT FROM NEW.visa_status AND OLD.visa_status IS NOT NULL THEN
    PERFORM extensions.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
      body := jsonb_build_object(
        'type', 'visa_status',
        'payload', jsonb_build_object(
          'talent_user_id', NEW.user_id,
          'talent_name', COALESCE(NEW.full_name, 'Talent'),
          'old_status', OLD.visa_status,
          'new_status', NEW.visa_status
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ═══ Function: notify on diploma verification ════════════════
CREATE OR REPLACE FUNCTION public.notify_diploma_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when status changes to verifie or refuse
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('verifie', 'refuse') THEN
    PERFORM extensions.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
      body := jsonb_build_object(
        'type', 'diploma_status',
        'payload', jsonb_build_object(
          'talent_user_id', NEW.user_id,
          'diploma_name', COALESCE(NEW.extracted_name, NEW.file_name),
          'status', NEW.status
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ═══ Triggers ═════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trigger_notify_visa_status ON public.talent_profiles;
CREATE TRIGGER trigger_notify_visa_status
  AFTER UPDATE OF visa_status ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_visa_status_change();

DROP TRIGGER IF EXISTS trigger_notify_diploma_status ON public.diplomas;
CREATE TRIGGER trigger_notify_diploma_status
  AFTER UPDATE OF status ON public.diplomas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_diploma_status_change();
