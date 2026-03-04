CREATE TRIGGER trigger_notify_matching_on_new_offer
  AFTER INSERT ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_matching_talents_on_new_offer();