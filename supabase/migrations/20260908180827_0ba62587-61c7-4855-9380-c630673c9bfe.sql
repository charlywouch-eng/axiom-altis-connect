BEGIN;

CREATE TABLE public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  job_offer_id uuid REFERENCES public.job_offers(id) ON DELETE SET NULL,
  position_title text NOT NULL,
  start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended_voluntary', 'ended_involuntary', 'ended_unknown')),
  end_date date,
  end_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.placements IS 'Un placement = un talent en poste chez un employeur. Socle de la donnee de retention (pari n.1 du Conseil du Corridor).';

CREATE INDEX idx_placements_talent ON public.placements(talent_user_id);
CREATE INDEX idx_placements_company ON public.placements(company_id);
CREATE INDEX idx_placements_status ON public.placements(status);

CREATE TABLE public.retention_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  checkpoint_day integer NOT NULL CHECK (checkpoint_day IN (30, 90, 180, 365)),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_active', 'confirmed_ended', 'no_response')),
  confirmed_by uuid REFERENCES auth.users(id),
  confirmed_at timestamptz,
  notes text,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(placement_id, checkpoint_day)
);

COMMENT ON TABLE public.retention_checkpoints IS 'Jalons J+30/90/180/365 d''un placement. Alimente en notifications automatiques (talent + entreprise) et en evenements du Passeport d''Integration.';

CREATE INDEX idx_retention_checkpoints_due ON public.retention_checkpoints(due_date, status);
CREATE INDEX idx_retention_checkpoints_placement ON public.retention_checkpoints(placement_id);

ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent reads own placements"
ON public.placements FOR SELECT TO authenticated
USING (auth.uid() = talent_user_id);

CREATE POLICY "company reads own placements"
ON public.placements FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = placements.company_id AND cp.user_id = auth.uid()));

CREATE POLICY "admins manage placements"
ON public.placements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "talent reads own retention checkpoints"
ON public.retention_checkpoints FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.placements p WHERE p.id = retention_checkpoints.placement_id AND p.talent_user_id = auth.uid()));

CREATE POLICY "company reads own retention checkpoints"
ON public.retention_checkpoints FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.placements p
  JOIN public.company_profiles cp ON cp.id = p.company_id
  WHERE p.id = retention_checkpoints.placement_id AND cp.user_id = auth.uid()
));

CREATE POLICY "admins manage retention checkpoints"
ON public.retention_checkpoints FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.placements TO authenticated;
GRANT SELECT, UPDATE ON public.retention_checkpoints TO authenticated;
GRANT ALL ON public.placements, public.retention_checkpoints TO service_role;

CREATE OR REPLACE FUNCTION public.create_retention_checkpoints()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.retention_checkpoints (placement_id, checkpoint_day, due_date)
  VALUES
    (NEW.id, 30, NEW.start_date + INTERVAL '30 days'),
    (NEW.id, 90, NEW.start_date + INTERVAL '90 days'),
    (NEW.id, 180, NEW.start_date + INTERVAL '180 days'),
    (NEW.id, 365, NEW.start_date + INTERVAL '365 days');
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_create_retention_checkpoints
AFTER INSERT ON public.placements
FOR EACH ROW EXECUTE FUNCTION public.create_retention_checkpoints();

CREATE OR REPLACE FUNCTION public.log_placement_integration_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.integration_events (talent_user_id, event_type, points, metadata, source)
  VALUES (
    NEW.talent_user_id,
    'placement_created',
    15,
    jsonb_build_object('placement_id', NEW.id, 'company_id', NEW.company_id, 'position_title', NEW.position_title),
    'system'
  );
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_log_placement_created
AFTER INSERT ON public.placements
FOR EACH ROW EXECUTE FUNCTION public.log_placement_integration_event();

CREATE OR REPLACE FUNCTION public.log_retention_checkpoint_integration_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_talent_user_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('confirmed_active', 'confirmed_ended') THEN
    SELECT talent_user_id INTO v_talent_user_id FROM public.placements WHERE id = NEW.placement_id;

    INSERT INTO public.integration_events (talent_user_id, event_type, points, metadata, source)
    VALUES (
      v_talent_user_id,
      CASE WHEN NEW.status = 'confirmed_active' THEN 'retention_checkpoint_passed' ELSE 'retention_checkpoint_failed' END,
      CASE WHEN NEW.status = 'confirmed_active' THEN GREATEST(5, NEW.checkpoint_day / 6) ELSE 0 END,
      jsonb_build_object('placement_id', NEW.placement_id, 'checkpoint_day', NEW.checkpoint_day),
      'system'
    );

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_talent_user_id,
      CASE WHEN NEW.status = 'confirmed_active' THEN 'Jalon de retention confirme' ELSE 'Jalon de retention : fin de poste' END,
      CASE WHEN NEW.status = 'confirmed_active'
        THEN format('Votre maintien en poste a J+%s a ete confirme. Bravo !', NEW.checkpoint_day)
        ELSE format('Le jalon J+%s indique une fin de poste. Notre equipe reste disponible.', NEW.checkpoint_day)
      END,
      'retention_checkpoint',
      '/dashboard-talent'
    );
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_log_retention_checkpoint
AFTER UPDATE ON public.retention_checkpoints
FOR EACH ROW EXECUTE FUNCTION public.log_retention_checkpoint_integration_event();

CREATE OR REPLACE FUNCTION public.notify_due_retention_checkpoints()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT rc.id, rc.checkpoint_day, p.talent_user_id, p.position_title, cp.user_id AS company_user_id
    FROM public.retention_checkpoints rc
    JOIN public.placements p ON p.id = rc.placement_id
    JOIN public.company_profiles cp ON cp.id = p.company_id
    WHERE rc.status = 'pending' AND rc.due_date <= CURRENT_DATE AND rc.notified_at IS NULL
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      r.talent_user_id,
      format('Check-in J+%s', r.checkpoint_day),
      format('Etes-vous toujours en poste sur "%s" ? Confirmez votre situation.', r.position_title),
      'retention_checkin',
      '/dashboard-talent'
    );

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      r.company_user_id,
      format('Check-in retention J+%s', r.checkpoint_day),
      format('Merci de confirmer si le talent place sur "%s" est toujours en poste.', r.position_title),
      'retention_checkin',
      '/dashboard-recruteur'
    );

    UPDATE public.retention_checkpoints SET notified_at = now() WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.notify_due_retention_checkpoints() TO service_role;

COMMIT;