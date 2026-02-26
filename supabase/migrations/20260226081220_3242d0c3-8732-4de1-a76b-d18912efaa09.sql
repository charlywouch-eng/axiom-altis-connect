
-- Function to auto-calculate compliance_score based on profile completeness
CREATE OR REPLACE FUNCTION public.calculate_compliance_score()
RETURNS TRIGGER AS $$
DECLARE
  score integer := 0;
  verified_diplomas integer := 0;
BEGIN
  -- Full name filled (+10)
  IF NEW.full_name IS NOT NULL AND NEW.full_name <> '' THEN
    score := score + 10;
  END IF;

  -- ROME code assigned (+15)
  IF NEW.rome_code IS NOT NULL AND NEW.rome_code <> '' THEN
    score := score + 15;
  END IF;

  -- Skills non-empty (+15)
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN
    score := score + 15;
  END IF;

  -- French level filled (+10)
  IF NEW.french_level IS NOT NULL AND NEW.french_level <> '' THEN
    score := score + 10;
  END IF;

  -- Experience > 0 (+10)
  IF NEW.experience_years IS NOT NULL AND NEW.experience_years > 0 THEN
    score := score + 10;
  END IF;

  -- Country filled (+5)
  IF NEW.country IS NOT NULL AND NEW.country <> '' THEN
    score := score + 5;
  END IF;

  -- Visa status beyond 'en_attente' (+10)
  IF NEW.visa_status IS NOT NULL AND NEW.visa_status <> 'en_attente' THEN
    score := score + 10;
  END IF;

  -- Verified diplomas (+25)
  SELECT COUNT(*) INTO verified_diplomas
  FROM public.diplomas
  WHERE talent_id = NEW.id AND status = 'verified';

  IF verified_diplomas > 0 THEN
    score := score + 25;
  END IF;

  NEW.compliance_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger on insert/update
DROP TRIGGER IF EXISTS trg_calculate_compliance ON public.talent_profiles;
CREATE TRIGGER trg_calculate_compliance
BEFORE INSERT OR UPDATE ON public.talent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.calculate_compliance_score();

-- Also recalculate when a diploma is verified
CREATE OR REPLACE FUNCTION public.update_talent_score_on_diploma()
RETURNS TRIGGER AS $$
BEGIN
  -- Touch the talent profile to trigger score recalculation
  UPDATE public.talent_profiles SET updated_at = now() WHERE id = NEW.talent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_diploma_score_update ON public.diplomas;
CREATE TRIGGER trg_diploma_score_update
AFTER INSERT OR UPDATE OF status ON public.diplomas
FOR EACH ROW
EXECUTE FUNCTION public.update_talent_score_on_diploma();

-- Recalculate all existing profiles now
UPDATE public.talent_profiles SET updated_at = now();
