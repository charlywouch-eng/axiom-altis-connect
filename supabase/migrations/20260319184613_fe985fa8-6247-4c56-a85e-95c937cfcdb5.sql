
-- Update auto_convo_on_matching to insert a welcome message after creating conversation
CREATE OR REPLACE FUNCTION public.auto_convo_on_matching()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _matched RECORD;
  _convo_id uuid;
  _company_name text;
  _welcome_msg text;
BEGIN
  IF NEW.status <> 'open' THEN RETURN NEW; END IF;
  IF NEW.required_skills IS NULL OR array_length(NEW.required_skills, 1) IS NULL THEN RETURN NEW; END IF;

  -- Get company name
  SELECT company_name INTO _company_name
  FROM public.company_profiles
  WHERE user_id = NEW.company_id
  LIMIT 1;

  FOR _matched IN
    SELECT tp.user_id, tp.full_name
    FROM public.talent_profiles tp
    WHERE tp.available = true
      AND tp.skills IS NOT NULL
      AND array_length(tp.skills, 1) > 0
      AND (
        SELECT COUNT(*)
        FROM unnest(tp.skills) s
        WHERE LOWER(s) = ANY(SELECT LOWER(x) FROM unnest(NEW.required_skills) x)
      ) > 0
    ORDER BY (
      SELECT COUNT(*)
      FROM unnest(tp.skills) s
      WHERE LOWER(s) = ANY(SELECT LOWER(x) FROM unnest(NEW.required_skills) x)
    ) DESC
    LIMIT 5
  LOOP
    _convo_id := ensure_conversation(NEW.company_id, _matched.user_id);

    -- Only insert welcome message if conversation was just created (no messages yet)
    IF _convo_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.messages WHERE conversation_id = _convo_id LIMIT 1
    ) THEN
      _welcome_msg := '👋 Bonjour ' || COALESCE(_matched.full_name, 'Talent') || ' ! ' ||
        'Votre profil correspond à notre offre « ' || NEW.title || ' » chez ' || COALESCE(_company_name, 'notre entreprise') || '. ' ||
        'N''hésitez pas à échanger ici pour en savoir plus sur cette opportunité. Bonne chance ! 🚀';

      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES (_convo_id, NEW.company_id, _welcome_msg);

      UPDATE public.conversations
      SET last_message_text = _welcome_msg, last_message_at = now()
      WHERE id = _convo_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Update auto_convo_on_candidature to insert a welcome message
CREATE OR REPLACE FUNCTION public.auto_convo_on_candidature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offer RECORD;
  _convo_id uuid;
  _talent_name text;
  _welcome_msg text;
BEGIN
  _talent_name := COALESCE(NEW.full_name, 'Talent');

  -- Match with companies having relevant open offers
  FOR _offer IN
    SELECT DISTINCT jo.company_id, jo.title,
      (SELECT cp.company_name FROM public.company_profiles cp WHERE cp.user_id = jo.company_id LIMIT 1) as company_name
    FROM public.job_offers jo
    WHERE jo.status = 'open'
      AND jo.required_skills IS NOT NULL
      AND array_length(jo.required_skills, 1) > 0
      AND NEW.competences IS NOT NULL
      AND array_length(NEW.competences, 1) > 0
      AND (
        SELECT COUNT(*)
        FROM unnest(NEW.competences) c
        WHERE LOWER(c) = ANY(SELECT LOWER(x) FROM unnest(jo.required_skills) x)
      ) > 0
    LIMIT 3
  LOOP
    _convo_id := ensure_conversation(NEW.talent_user_id, _offer.company_id);

    IF _convo_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.messages WHERE conversation_id = _convo_id LIMIT 1
    ) THEN
      _welcome_msg := '🎯 ' || _talent_name || ' a postulé via AXIOM et son profil correspond à votre offre « ' || _offer.title || ' ». ' ||
        'Vous pouvez échanger directement ici. Bonne discussion ! 💬';

      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES (_convo_id, NEW.talent_user_id, _welcome_msg);

      UPDATE public.conversations
      SET last_message_text = _welcome_msg, last_message_at = now()
      WHERE id = _convo_id;
    END IF;
  END LOOP;

  -- Connect with recruiters
  FOR _offer IN
    SELECT ur.user_id as recruiter_id
    FROM public.user_roles ur
    WHERE ur.role = 'recruteur'
    LIMIT 2
  LOOP
    _convo_id := ensure_conversation(NEW.talent_user_id, _offer.recruiter_id);

    IF _convo_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.messages WHERE conversation_id = _convo_id LIMIT 1
    ) THEN
      _welcome_msg := '👋 Bienvenue ' || _talent_name || ' ! Un recruteur AXIOM est disponible pour vous accompagner dans votre projet professionnel en France. N''hésitez pas à poser vos questions ici. 🇫🇷';

      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES (_convo_id, _offer.recruiter_id, _welcome_msg);

      UPDATE public.conversations
      SET last_message_text = _welcome_msg, last_message_at = now()
      WHERE id = _convo_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
