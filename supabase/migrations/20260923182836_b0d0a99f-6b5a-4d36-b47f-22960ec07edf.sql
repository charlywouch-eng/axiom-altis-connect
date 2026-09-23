grant select on public.simulator_settings to anon, authenticated;
alter function public._sim_score(text,text,text,text,boolean) set search_path = public;
alter function public._sim_reco(jsonb, public.metiers_minefop_rome) set search_path = public;
delete from public.referral_clicks where referral_code in (select referral_code from public.leads where email_or_phone like 'test.sim%@axiom-talents.com');
delete from public.funnel_events where source = 'simulateur_beta' and created_at > now() - interval '1 day' and (metadata->>'pays') in ('Cameroun','Maroc') and rome_code in ('F1703','J1506');
delete from public.leads where email_or_phone like 'test.sim%@axiom-talents.com';