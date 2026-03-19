
-- 1. Helper function: creates a conversation between two users if none exists
CREATE OR REPLACE FUNCTION public.ensure_conversation(_user_a uuid, _user_b uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _convo_id uuid;
BEGIN
  -- Don't create self-conversations
  IF _user_a = _user_b THEN RETURN NULL; END IF;

  -- Check if conversation already exists (in either direction)
  SELECT id INTO _convo_id
  FROM public.conversations
  WHERE (participant_1 = _user_a AND participant_2 = _user_b)
     OR (participant_1 = _user_b AND participant_2 = _user_a)
  LIMIT 1;

  IF _convo_id IS NOT NULL THEN
    RETURN _convo_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (participant_1, participant_2, last_message_text)
  VALUES (_user_a, _user_b, NULL)
  RETURNING id INTO _convo_id;

  RETURN _convo_id;
END;
$$;

-- 2. Trigger function: auto-create conversations when a new job offer is posted (with matching talents)
CREATE OR REPLACE FUNCTION public.auto_convo_on_matching()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _matched RECORD;
BEGIN
  IF NEW.status <> 'open' THEN RETURN NEW; END IF;
  IF NEW.required_skills IS NULL OR array_length(NEW.required_skills, 1) IS NULL THEN RETURN NEW; END IF;

  FOR _matched IN
    SELECT tp.user_id
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
    PERFORM ensure_conversation(NEW.company_id, _matched.user_id);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_convo_on_job_offer
  AFTER INSERT ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convo_on_matching();

-- 3. Trigger function: auto-create conversations when a candidature is submitted
CREATE OR REPLACE FUNCTION public.auto_convo_on_candidature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offer RECORD;
BEGIN
  -- Find open job offers whose required_skills overlap with the talent's competences
  FOR _offer IN
    SELECT DISTINCT jo.company_id
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
    PERFORM ensure_conversation(NEW.talent_user_id, _offer.company_id);
  END LOOP;

  -- Also connect with recruiters who have viewed/interacted (all recruteurs for now)
  -- Create conversation with up to 2 recruiters
  PERFORM ensure_conversation(NEW.talent_user_id, ur.user_id)
  FROM public.user_roles ur
  WHERE ur.role = 'recruteur'
  LIMIT 2;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_convo_on_candidature
  AFTER INSERT ON public.candidatures
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convo_on_candidature();
