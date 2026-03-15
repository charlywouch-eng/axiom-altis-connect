
-- Update talent_update_check to log manipulation attempts to audit_logs
CREATE OR REPLACE FUNCTION public.talent_update_check()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If the caller is NOT an admin, block changes to sensitive fields and log attempt
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'premium_manipulation_blocked', jsonb_build_object(
        'field', 'is_premium',
        'old_value', OLD.is_premium,
        'attempted_value', NEW.is_premium,
        'talent_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify is_premium';
    END IF;
    IF NEW.compliance_score IS DISTINCT FROM OLD.compliance_score THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'premium_manipulation_blocked', jsonb_build_object(
        'field', 'compliance_score',
        'old_value', OLD.compliance_score,
        'attempted_value', NEW.compliance_score,
        'talent_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify compliance_score';
    END IF;
    IF NEW.visa_status IS DISTINCT FROM OLD.visa_status THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'premium_manipulation_blocked', jsonb_build_object(
        'field', 'visa_status',
        'old_value', OLD.visa_status,
        'attempted_value', NEW.visa_status,
        'talent_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify visa_status';
    END IF;
    IF NEW.premium_unlocked_at IS DISTINCT FROM OLD.premium_unlocked_at THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'premium_manipulation_blocked', jsonb_build_object(
        'field', 'premium_unlocked_at',
        'talent_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify premium_unlocked_at';
    END IF;
    IF NEW.score IS DISTINCT FROM OLD.score THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'premium_manipulation_blocked', jsonb_build_object(
        'field', 'score',
        'old_value', OLD.score,
        'attempted_value', NEW.score,
        'talent_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify score';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Same for talent_insert_check - log forced defaults
CREATE OR REPLACE FUNCTION public.talent_insert_check()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    -- Log if someone tried to set premium fields on insert
    IF NEW.is_premium = true OR NEW.compliance_score <> 0 OR NEW.visa_status <> 'en_attente' OR NEW.score <> 0 OR NEW.premium_unlocked_at IS NOT NULL THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'premium_insert_manipulation_blocked', jsonb_build_object(
        'attempted_is_premium', NEW.is_premium,
        'attempted_compliance_score', NEW.compliance_score,
        'attempted_visa_status', NEW.visa_status,
        'attempted_score', NEW.score
      ));
    END IF;
    -- Force safe defaults on insert for non-admins
    NEW.is_premium := false;
    NEW.compliance_score := 0;
    NEW.visa_status := 'en_attente';
    NEW.score := 0;
    NEW.premium_unlocked_at := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Same for company_profile_update_check
CREATE OR REPLACE FUNCTION public.company_profile_update_check()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.is_subscribed IS DISTINCT FROM OLD.is_subscribed THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'subscription_manipulation_blocked', jsonb_build_object(
        'field', 'is_subscribed',
        'old_value', OLD.is_subscribed,
        'attempted_value', NEW.is_subscribed,
        'company_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify is_subscribed';
    END IF;
    IF NEW.subscription_end IS DISTINCT FROM OLD.subscription_end THEN
      INSERT INTO public.audit_logs (user_id, action, details)
      VALUES (auth.uid(), 'subscription_manipulation_blocked', jsonb_build_object(
        'field', 'subscription_end',
        'company_profile_id', OLD.id
      ));
      RAISE EXCEPTION 'Cannot modify subscription_end';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
