
-- Fix: restrict talent diploma updates
DROP POLICY IF EXISTS "Talents can update own diplomas" ON public.diplomas;

CREATE POLICY "Talents can update own diplomas"
ON public.diplomas
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'en_attente'
);
