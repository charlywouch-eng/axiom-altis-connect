
-- ═══ Function: auto-match talents when a new offer is created ═══
CREATE OR REPLACE FUNCTION public.notify_matching_talents_on_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _matched RECORD;
  _company_name text;
BEGIN
  -- Only fire on new open offers
  IF NEW.status <> 'open' THEN
    RETURN NEW;
  END IF;

  -- Get company name
  SELECT company_name INTO _company_name
  FROM public.company_profiles
  WHERE user_id = NEW.company_id
  LIMIT 1;

  -- Find matching talents via RPC logic (top 10, score >= 50)
  FOR _matched IN
    SELECT tp.user_id, tp.full_name
    FROM public.talent_profiles tp
    WHERE tp.available = true
      AND tp.skills IS NOT NULL
      AND array_length(tp.skills, 1) > 0
      AND NEW.required_skills IS NOT NULL
      AND array_length(NEW.required_skills, 1) > 0
      AND (
        SELECT COUNT(*)
        FROM unnest(tp.skills) s
        WHERE s = ANY(NEW.required_skills)
      ) > 0
    ORDER BY (
      SELECT COUNT(*)
      FROM unnest(tp.skills) s
      WHERE s = ANY(NEW.required_skills)
    ) DESC
    LIMIT 10
  LOOP
    -- Call send-notification for each matching talent
    PERFORM extensions.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
      body := jsonb_build_object(
        'type', 'match_talent',
        'payload', jsonb_build_object(
          'talent_user_id', _matched.user_id,
          'offer_title', NEW.title,
          'company_name', COALESCE(_company_name, 'Entreprise')
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    );
  END LOOP;

  -- Also notify the entreprise about top matching talent
  IF _matched IS NOT NULL THEN
    PERFORM extensions.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
      body := jsonb_build_object(
        'type', 'match_entreprise',
        'payload', jsonb_build_object(
          'entreprise_user_id', NEW.company_id,
          'talent_name', COALESCE((
            SELECT full_name FROM public.talent_profiles
            WHERE available = true AND skills && NEW.required_skills
            ORDER BY compliance_score DESC LIMIT 1
          ), 'Talent vérifié'),
          'score', COALESCE((
            SELECT compliance_score FROM public.talent_profiles
            WHERE available = true AND skills && NEW.required_skills
            ORDER BY compliance_score DESC LIMIT 1
          ), 0)
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

-- ═══ Trigger ══════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trigger_match_on_new_offer ON public.job_offers;
CREATE TRIGGER trigger_match_on_new_offer
  AFTER INSERT ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_matching_talents_on_new_offer();
