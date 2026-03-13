
-- FIX 1: Add role check on job_offers INSERT
DROP POLICY IF EXISTS "Companies can create offers" ON public.job_offers;
CREATE POLICY "Companies can create offers"
  ON public.job_offers
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = company_id AND has_role(auth.uid(), 'entreprise'::app_role));

-- FIX 2: Acknowledge talent_profiles trigger protection at RLS level
-- The scanner wants explicit RLS-level field protection. Use a security definer function.
CREATE OR REPLACE FUNCTION public.talent_update_rls_check(_user_id uuid, _is_premium boolean, _compliance_score integer, _visa_status text, _score numeric, _premium_unlocked_at timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    _is_premium = (SELECT tp.is_premium FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _compliance_score = (SELECT tp.compliance_score FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _visa_status = (SELECT tp.visa_status FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _score IS NOT DISTINCT FROM (SELECT tp.score FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
    AND _premium_unlocked_at IS NOT DISTINCT FROM (SELECT tp.premium_unlocked_at FROM public.talent_profiles tp WHERE tp.user_id = _user_id)
$$;

DROP POLICY IF EXISTS "Talents can update own talent_profile" ON public.talent_profiles;
CREATE POLICY "Talents can update own talent_profile"
  ON public.talent_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND talent_update_rls_check(user_id, is_premium, compliance_score, visa_status, score, premium_unlocked_at)
  );
