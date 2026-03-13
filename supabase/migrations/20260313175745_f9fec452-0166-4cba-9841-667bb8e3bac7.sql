
-- Fix: Use security definer function to protect subscription fields on UPDATE
CREATE OR REPLACE FUNCTION public.company_update_rls_check(_user_id uuid, _is_subscribed boolean, _subscription_end timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    _is_subscribed = (SELECT cp.is_subscribed FROM public.company_profiles cp WHERE cp.user_id = _user_id)
    AND _subscription_end IS NOT DISTINCT FROM (SELECT cp.subscription_end FROM public.company_profiles cp WHERE cp.user_id = _user_id)
$$;

DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
CREATE POLICY "Companies can update own profile"
ON public.company_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND company_update_rls_check(user_id, is_subscribed, subscription_end)
);
