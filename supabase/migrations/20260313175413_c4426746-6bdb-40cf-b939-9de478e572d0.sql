
-- FIX: Harden diplomas INSERT policy to prevent self-certification
DROP POLICY IF EXISTS "Talents can insert own diplomas" ON public.diplomas;
CREATE POLICY "Talents can insert own diplomas"
ON public.diplomas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'en_attente'
  AND minfop_verified = false
  AND apostille_verified = false
);

-- FIX: Harden talent_profiles INSERT policy to prevent self-premium
DROP POLICY IF EXISTS "Talents can insert own talent_profile" ON public.talent_profiles;
CREATE POLICY "Talents can insert own talent_profile"
ON public.talent_profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND is_premium = false
  AND premium_unlocked_at IS NULL
  AND compliance_score = 0
  AND score = 0
  AND visa_status = 'en_attente'
);
