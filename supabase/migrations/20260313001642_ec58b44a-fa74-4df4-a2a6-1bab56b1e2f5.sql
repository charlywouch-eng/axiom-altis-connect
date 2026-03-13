
-- 1. Fix user_roles: restrict UPDATE so users can only set non-admin roles during onboarding
DROP POLICY IF EXISTS "Users can set their own role during onboarding" ON public.user_roles;

CREATE POLICY "Users can set their own role during onboarding"
ON public.user_roles
FOR UPDATE
TO public
USING (auth.uid() = user_id AND role IS NULL)
WITH CHECK (auth.uid() = user_id AND role IN ('talent', 'entreprise', 'recruteur'));

-- 2. Fix talent_profiles: replace permissive UPDATE with one that blocks sensitive fields
DROP POLICY IF EXISTS "Talents can update own talent_profile" ON public.talent_profiles;

-- Create a security definer function to validate talent self-updates
CREATE OR REPLACE FUNCTION public.talent_update_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is NOT an admin, block changes to sensitive fields
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'Cannot modify is_premium';
    END IF;
    IF NEW.compliance_score IS DISTINCT FROM OLD.compliance_score THEN
      RAISE EXCEPTION 'Cannot modify compliance_score';
    END IF;
    IF NEW.visa_status IS DISTINCT FROM OLD.visa_status THEN
      RAISE EXCEPTION 'Cannot modify visa_status';
    END IF;
    IF NEW.premium_unlocked_at IS DISTINCT FROM OLD.premium_unlocked_at THEN
      RAISE EXCEPTION 'Cannot modify premium_unlocked_at';
    END IF;
    IF NEW.score IS DISTINCT FROM OLD.score THEN
      RAISE EXCEPTION 'Cannot modify score';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce field protection
DROP TRIGGER IF EXISTS protect_talent_sensitive_fields ON public.talent_profiles;
CREATE TRIGGER protect_talent_sensitive_fields
BEFORE UPDATE ON public.talent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.talent_update_check();

-- Re-create the talent update policy (unchanged but clean)
CREATE POLICY "Talents can update own talent_profile"
ON public.talent_profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
