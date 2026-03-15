
-- Performance indexes for talent_profiles
CREATE INDEX IF NOT EXISTS idx_talent_profiles_user_id_premium ON public.talent_profiles (user_id, is_premium);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_available_score ON public.talent_profiles (available, compliance_score DESC);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_rome_available ON public.talent_profiles (rome_code, available);

-- Performance index for user_roles lookups (used heavily by has_role)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- Performance index for company subscription checks
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_subscribed ON public.company_profiles (user_id, is_subscribed);
