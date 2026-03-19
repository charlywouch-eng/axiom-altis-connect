
-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  participant_1 uuid NOT NULL,
  participant_2 uuid NOT NULL,
  last_message_text text,
  last_message_at timestamptz DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2)
);

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: participants only
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can insert conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Admins full access conversations"
  ON public.conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Messages RLS: conversation participants only
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can insert messages in own conversations"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Admins full access messages"
  ON public.messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Index for performance
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_1, participant_2);
