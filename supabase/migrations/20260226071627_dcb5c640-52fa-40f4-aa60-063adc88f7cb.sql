-- Harden SELECT access with explicit RESTRICTIVE policies to avoid lateral data exposure.
-- This keeps existing behavior but makes denial semantics explicit for scanners.

-- company_profiles
DROP POLICY IF EXISTS "Restrict company_profiles select to owner_or_admin" ON public.company_profiles;
CREATE POLICY "Restrict company_profiles select to owner_or_admin"
ON public.company_profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- profiles
DROP POLICY IF EXISTS "Restrict profiles select to self_or_admin" ON public.profiles;
CREATE POLICY "Restrict profiles select to self_or_admin"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- talent_profiles: explicit restrictive gate for any SELECT access path
DROP POLICY IF EXISTS "Restrict talent_profiles select by role_and_subscription" ON public.talent_profiles;
CREATE POLICY "Restrict talent_profiles select by role_and_subscription"
ON public.talent_profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'entreprise'::public.app_role)
    AND public.is_enterprise_subscribed(auth.uid())
    AND available = true
  )
);

-- diplomas: explicit restrictive gate for any SELECT access path
DROP POLICY IF EXISTS "Restrict diplomas select by role_and_subscription" ON public.diplomas;
CREATE POLICY "Restrict diplomas select by role_and_subscription"
ON public.diplomas
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'entreprise'::public.app_role)
    AND public.is_enterprise_subscribed(auth.uid())
    AND status = 'verifie'::text
  )
);