
-- Trigger: create a notification when a new message is inserted in a conversation
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _convo RECORD;
  _recipient_id uuid;
  _sender_name text;
  _preview text;
BEGIN
  -- Get conversation participants
  SELECT participant_1, participant_2 INTO _convo
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF _convo IS NULL THEN RETURN NEW; END IF;

  -- Determine recipient (the other participant)
  IF NEW.sender_id = _convo.participant_1 THEN
    _recipient_id := _convo.participant_2;
  ELSE
    _recipient_id := _convo.participant_1;
  END IF;

  -- Get sender display name
  SELECT COALESCE(full_name, first_name, email) INTO _sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id
  LIMIT 1;

  _sender_name := COALESCE(_sender_name, 'Utilisateur');

  -- Truncate message preview
  _preview := LEFT(NEW.content, 80);
  IF length(NEW.content) > 80 THEN
    _preview := _preview || '…';
  END IF;

  -- Insert notification for recipient
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    _recipient_id,
    '💬 Nouveau message de ' || _sender_name,
    _preview,
    'message',
    '/messages'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
