-- Fix: Restrict entreprise access to only available talent profiles
DROP POLICY IF EXISTS "Entreprises can view talent_profiles" ON public.talent_profiles;

CREATE POLICY "Entreprises can view available talent_profiles"
ON public.talent_profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'entreprise'::app_role)
  AND available = true
);

-- Fix: Ensure profiles table has no public/anon access by revoking grants
-- The existing RLS policies already restrict to own profile + admin, 
-- but let's make sure anon role has no access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;