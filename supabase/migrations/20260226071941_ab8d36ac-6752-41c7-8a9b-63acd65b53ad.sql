-- RGPD: Add DELETE policies for users to delete their own data (right to erasure)

-- profiles: users can delete own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- talent_profiles: talents can delete own profile
CREATE POLICY "Talents can delete own talent_profile"
ON public.talent_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- diplomas: talents can delete own diplomas
CREATE POLICY "Talents can delete own diplomas"
ON public.diplomas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- company_profiles: companies can delete own profile
CREATE POLICY "Companies can delete own profile"
ON public.company_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- quote_requests: users can view own quote requests
CREATE POLICY "Users can view own quote requests"
ON public.quote_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);