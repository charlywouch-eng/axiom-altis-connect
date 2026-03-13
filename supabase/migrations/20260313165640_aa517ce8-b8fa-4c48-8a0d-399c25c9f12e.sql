
-- FIX 1: PRIVILEGE ESCALATION - Restrict user_roles INSERT to non-admin roles only
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert own role on signup"
  ON public.user_roles
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id 
    AND (role IS NULL OR role = ANY (ARRAY['talent'::app_role, 'entreprise'::app_role, 'recruteur'::app_role]))
  );

-- FIX 2: FIELD-LEVEL RLS - Restrict talent_profiles UPDATE to safe fields via RLS function
CREATE OR REPLACE FUNCTION public.talent_profile_update_check_rls(old_row talent_profiles, new_row talent_profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Block RLS-level changes to system fields (defense-in-depth with trigger)
  IF new_row.is_premium IS DISTINCT FROM old_row.is_premium THEN RETURN false; END IF;
  IF new_row.compliance_score IS DISTINCT FROM old_row.compliance_score THEN RETURN false; END IF;
  IF new_row.visa_status IS DISTINCT FROM old_row.visa_status THEN RETURN false; END IF;
  IF new_row.premium_unlocked_at IS DISTINCT FROM old_row.premium_unlocked_at THEN RETURN false; END IF;
  IF new_row.score IS DISTINCT FROM old_row.score THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- Replace the permissive UPDATE policy with field-level restrictions
DROP POLICY IF EXISTS "Talents can update own talent_profile" ON public.talent_profiles;
CREATE POLICY "Talents can update own talent_profile"
  ON public.talent_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_premium = (SELECT tp.is_premium FROM public.talent_profiles tp WHERE tp.id = id)
    AND compliance_score = (SELECT tp.compliance_score FROM public.talent_profiles tp WHERE tp.id = id)
    AND visa_status = (SELECT tp.visa_status FROM public.talent_profiles tp WHERE tp.id = id)
    AND score = (SELECT tp.score FROM public.talent_profiles tp WHERE tp.id = id)
    AND premium_unlocked_at IS NOT DISTINCT FROM (SELECT tp.premium_unlocked_at FROM public.talent_profiles tp WHERE tp.id = id)
  );
