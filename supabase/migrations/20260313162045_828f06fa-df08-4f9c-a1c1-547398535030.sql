
-- 1. Attach trigger: protect sensitive fields on talent_profiles
CREATE OR REPLACE TRIGGER protect_sensitive_fields
  BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.talent_update_check();

-- 2. Attach trigger: recalculate compliance score on talent_profiles
CREATE OR REPLACE TRIGGER recalculate_compliance_score
  BEFORE INSERT OR UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_compliance_score();

-- 3. Attach trigger: prevent role escalation on user_roles
CREATE OR REPLACE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- 4. Attach trigger: update talent score when diploma changes
CREATE OR REPLACE TRIGGER update_talent_on_diploma_change
  AFTER INSERT OR UPDATE ON public.diplomas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_talent_score_on_diploma();

-- 5. Attach trigger: notify on visa status change
CREATE OR REPLACE TRIGGER notify_visa_change
  AFTER UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_visa_status_change();

-- 6. Attach trigger: notify on diploma status change
CREATE OR REPLACE TRIGGER notify_diploma_change
  AFTER UPDATE ON public.diplomas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_diploma_status_change();

-- 7. Attach trigger: notify matching talents on new offer
CREATE OR REPLACE TRIGGER notify_matching_on_offer
  AFTER INSERT ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_matching_talents_on_new_offer();

-- 8. Attach updated_at triggers
CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_talent_profiles
  BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_company_profiles
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_job_offers
  BEFORE UPDATE ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_quote_requests
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_diplomas
  BEFORE UPDATE ON public.diplomas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
