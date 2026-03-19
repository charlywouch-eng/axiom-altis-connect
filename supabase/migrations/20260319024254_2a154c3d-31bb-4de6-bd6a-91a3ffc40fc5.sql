CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_premium boolean := false;
  _rome_code text;
  _rome_label text;
  _experience text;
BEGIN
  INSERT INTO public.profiles (id, email, first_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NULL);
  END IF;

  _is_premium := false;
  SELECT true INTO _is_premium
  FROM public.leads
  WHERE email_or_phone = NEW.email
    AND status = 'premium_paid'
  LIMIT 1;

  _rome_code  := NEW.raw_user_meta_data ->> 'rome_code';
  _rome_label := NEW.raw_user_meta_data ->> 'rome_label';
  _experience := NEW.raw_user_meta_data ->> 'experience';

  IF _is_premium THEN
    INSERT INTO public.talent_profiles (
      user_id, is_premium, premium_unlocked_at, visa_status,
      rome_code, rome_label,
      experience_years
    ) VALUES (
      NEW.id, true, now(), 'en_attente',
      _rome_code, _rome_label,
      CASE _experience
        WHEN '0-2' THEN 1
        WHEN '2-5' THEN 3
        WHEN '5-10' THEN 7
        WHEN '10+' THEN 12
        ELSE NULL
      END
    );

    UPDATE public.leads
    SET status = 'reconciled'
    WHERE email_or_phone = NEW.email
      AND status = 'premium_paid';
  END IF;

  RETURN NEW;
END;
$function$;