-- 1. Diplomas storage: require an active subscription for entreprise users
DROP POLICY IF EXISTS "Talents can view own diplomas" ON storage.objects;
CREATE POLICY "Diploma files restricted access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'diplomas' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'entreprise') AND public.is_enterprise_subscribed(auth.uid()))
  )
);

-- 2. Public buckets: files stay readable by direct URL, but listing is no longer allowed
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Company logos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;
CREATE POLICY "Owners can read own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can read own company logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'company-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can read email assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

-- 3. Leads: make the admin-only restriction explicit
DROP POLICY IF EXISTS "Leads readable by admins only" ON public.leads;
CREATE POLICY "Leads readable by admins only"
ON public.leads AS RESTRICTIVE FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Talent notification log: talents can read their own entries
DROP POLICY IF EXISTS "Talents can view own notification log" ON public.talent_notification_log;
CREATE POLICY "Talents can view own notification log"
ON public.talent_notification_log FOR SELECT TO authenticated
USING (talent_user_id = auth.uid());
GRANT SELECT ON public.talent_notification_log TO authenticated;

-- 5. Realtime: audit logs no longer streamed to subscribers
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs;

-- 6. Lock down SECURITY DEFINER functions from public execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_enterprise_subscribed(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_conversation(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.match_talents_for_offer(text[], numeric, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.talent_update_rls_check(uuid, boolean, integer, text, numeric, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.talent_profile_update_check_rls(public.talent_profiles, public.talent_profiles) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.company_update_rls_check(uuid, boolean, timestamptz) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enterprise_subscribed(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_conversation(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_talents_for_offer(text[], numeric, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.talent_update_rls_check(uuid, boolean, integer, text, numeric, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.talent_profile_update_check_rls(public.talent_profiles, public.talent_profiles) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.company_update_rls_check(uuid, boolean, timestamptz) TO authenticated, service_role;