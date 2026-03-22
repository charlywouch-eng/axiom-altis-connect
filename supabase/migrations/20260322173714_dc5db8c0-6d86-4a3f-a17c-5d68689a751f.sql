
-- 1. Drop the old INSERT policy that allows recruteur self-assignment
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;

-- 2. Recreate INSERT policy WITHOUT recruteur
CREATE POLICY "Users can insert own role on signup"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() = user_id)
  AND (
    (role IS NULL)
    OR (role = ANY (ARRAY['talent'::app_role, 'entreprise'::app_role]))
  )
  AND (NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IS NOT NULL
  ))
);

-- 3. Drop the old UPDATE policy for onboarding
DROP POLICY IF EXISTS "Users can set their own role during onboarding" ON public.user_roles;

-- 4. Recreate UPDATE policy WITHOUT recruteur
CREATE POLICY "Users can set their own role during onboarding"
ON public.user_roles
FOR UPDATE
TO public
USING (auth.uid() = user_id AND role IS NULL)
WITH CHECK (
  auth.uid() = user_id
  AND role = ANY (ARRAY['talent'::app_role, 'entreprise'::app_role])
);

-- 5. Drop old permissive recruteur candidatures policy and recreate with admin-approved check
DROP POLICY IF EXISTS "Recruteurs can view candidatures" ON public.candidatures;

-- 6. Recruteurs can only view candidatures if their role was assigned by admin (not self-assigned)
-- Since recruteur can no longer be self-assigned, this is defense-in-depth
CREATE POLICY "Recruteurs can view candidatures"
ON public.candidatures
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'recruteur'::app_role)
  AND status = 'submitted'
);
