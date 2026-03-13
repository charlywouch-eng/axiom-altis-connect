
-- FIX 1: Protect company_profiles subscription fields via trigger
CREATE OR REPLACE FUNCTION public.company_profile_update_check()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.is_subscribed IS DISTINCT FROM OLD.is_subscribed THEN
      RAISE EXCEPTION 'Cannot modify is_subscribed';
    END IF;
    IF NEW.subscription_end IS DISTINCT FROM OLD.subscription_end THEN
      RAISE EXCEPTION 'Cannot modify subscription_end';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_company_subscription_fields
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.company_profile_update_check();

-- FIX 2: Also protect INSERT on talent_profiles (is_premium on insert)
CREATE OR REPLACE FUNCTION public.talent_insert_check()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    -- Force safe defaults on insert for non-admins
    NEW.is_premium := false;
    NEW.compliance_score := 0;
    NEW.visa_status := 'en_attente';
    NEW.score := 0;
    NEW.premium_unlocked_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_talent_insert_fields
  BEFORE INSERT ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.talent_insert_check();

-- FIX 3: Protect company_profiles INSERT subscription fields too
CREATE OR REPLACE FUNCTION public.company_profile_insert_check()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    NEW.is_subscribed := false;
    NEW.subscription_end := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_company_insert_fields
  BEFORE INSERT ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.company_profile_insert_check();
