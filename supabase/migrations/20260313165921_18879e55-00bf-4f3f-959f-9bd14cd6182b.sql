
-- FIX 1: Broken WITH CHECK correlation on talent_profiles
-- Use the trigger (already in place) as the enforcement mechanism
-- and simplify the RLS policy to just check ownership
DROP POLICY IF EXISTS "Talents can update own talent_profile" ON public.talent_profiles;
CREATE POLICY "Talents can update own talent_profile"
  ON public.talent_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The trigger talent_update_check() (SECURITY DEFINER, BEFORE UPDATE) already blocks
-- modifications to is_premium, compliance_score, visa_status, score, premium_unlocked_at
-- for non-admin users. This is the correct enforcement mechanism for field-level protection.

-- FIX 2: Prevent multiple role insertion per user
-- Add UNIQUE constraint on user_id (one role per user)
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Also restrict INSERT to only allow when user has no existing role
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert own role on signup"
  ON public.user_roles
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id 
    AND (role IS NULL OR role = ANY (ARRAY['talent'::app_role, 'entreprise'::app_role, 'recruteur'::app_role]))
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IS NOT NULL)
  );
