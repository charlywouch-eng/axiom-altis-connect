-- Update DB triggers to use service_role key from vault instead of hardcoded anon key
-- This prevents unauthorized notification sending via the public anon key

CREATE OR REPLACE FUNCTION public.notify_diploma_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _base_url text := 'https://wfolueffkdzknuowwecf.supabase.co/functions/v1/send-notification';
  _service_key text;
BEGIN
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  IF _service_key IS NULL THEN RETURN NEW; END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('verifie', 'refuse') THEN
    PERFORM net.http_post(
      url := _base_url,
      body := jsonb_build_object(
        'type', 'diploma_status',
        'payload', jsonb_build_object(
          'talent_user_id', NEW.user_id,
          'diploma_name', COALESCE(NEW.extracted_name, NEW.file_name),
          'status', NEW.status
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_visa_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _base_url text := 'https://wfolueffkdzknuowwecf.supabase.co/functions/v1/send-notification';
  _service_key text;
BEGIN
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  IF _service_key IS NULL THEN RETURN NEW; END IF;

  IF OLD.visa_status IS DISTINCT FROM NEW.visa_status AND OLD.visa_status IS NOT NULL THEN
    PERFORM net.http_post(
      url := _base_url,
      body := jsonb_build_object(
        'type', 'visa_status',
        'payload', jsonb_build_object(
          'talent_user_id', NEW.user_id,
          'talent_name', COALESCE(NEW.full_name, 'Talent'),
          'old_status', OLD.visa_status,
          'new_status', NEW.visa_status
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _base_url text := 'https://wfolueffkdzknuowwecf.supabase.co/functions/v1/send-notification';
  _service_key text;
BEGIN
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  IF _service_key IS NULL THEN RETURN NEW; END IF;

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
      'Authorization', 'Bearer ' || _service_key
    )
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_matching_talents_on_new_offer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _matched RECORD;
  _company_name text;
  _base_url text := 'https://wfolueffkdzknuowwecf.supabase.co/functions/v1/send-notification';
  _service_key text;
BEGIN
  IF NEW.status <> 'open' THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  IF _service_key IS NULL THEN RETURN NEW; END IF;

  SELECT company_name INTO _company_name
  FROM public.company_profiles WHERE user_id = NEW.company_id LIMIT 1;

  FOR _matched IN
    SELECT tp.user_id, tp.full_name
    FROM public.talent_profiles tp
    WHERE tp.available = true
      AND tp.skills IS NOT NULL AND array_length(tp.skills, 1) > 0
      AND NEW.required_skills IS NOT NULL AND array_length(NEW.required_skills, 1) > 0
      AND (SELECT COUNT(*) FROM unnest(tp.skills) s WHERE LOWER(s) = ANY(SELECT LOWER(x) FROM unnest(NEW.required_skills) x)) > 0
    ORDER BY (SELECT COUNT(*) FROM unnest(tp.skills) s WHERE LOWER(s) = ANY(SELECT LOWER(x) FROM unnest(NEW.required_skills) x)) DESC
    LIMIT 10
  LOOP
    PERFORM net.http_post(
      url := _base_url,
      body := jsonb_build_object(
        'type', 'match_talent',
        'payload', jsonb_build_object(
          'talent_user_id', _matched.user_id,
          'offer_title', NEW.title,
          'company_name', COALESCE(_company_name, 'Entreprise')
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key
      )
    );
  END LOOP;
  RETURN NEW;
END;
$function$