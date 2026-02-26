
-- 1. Add is_subscribed column to company_profiles
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS is_subscribed boolean NOT NULL DEFAULT false;

ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone DEFAULT NULL;

-- 2. Create a SECURITY DEFINER function to check if an enterprise user has active subscription
CREATE OR REPLACE FUNCTION public.is_enterprise_subscribed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_profiles
    WHERE user_id = _user_id 
      AND is_subscribed = true
      AND (subscription_end IS NULL OR subscription_end > now())
  )
$$;

-- 3. Drop old permissive talent_profiles policy for entreprises
DROP POLICY IF EXISTS "Entreprises can view available talent_profiles" ON public.talent_profiles;

-- 4. Create new restrictive policy: only SUBSCRIBED entreprises can view talent_profiles
CREATE POLICY "Subscribed entreprises can view available talent_profiles"
ON public.talent_profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'entreprise'::app_role) 
  AND available = true 
  AND is_enterprise_subscribed(auth.uid())
);

-- 5. Drop old permissive diplomas policy for entreprises
DROP POLICY IF EXISTS "Entreprises can view verified diplomas" ON public.diplomas;

-- 6. Create new restrictive policy: only SUBSCRIBED entreprises can view verified diplomas
CREATE POLICY "Subscribed entreprises can view verified diplomas"
ON public.diplomas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'entreprise'::app_role) 
  AND status = 'verifie'::text
  AND is_enterprise_subscribed(auth.uid())
);

-- 7. Also allow recruteurs with enterprise subscription context (admin + recruteur keep their existing policies)
