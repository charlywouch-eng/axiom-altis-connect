alter table public.leads
  add column if not exists first_name       text,
  add column if not exists pays             text,
  add column if not exists diplome          text,
  add column if not exists niveau_francais  text,
  add column if not exists passeport        boolean,
  add column if not exists score_v2         integer,
  add column if not exists score_details    jsonb,
  add column if not exists result_token     uuid unique default gen_random_uuid(),
  add column if not exists referral_code    text unique,
  add column if not exists referred_by      text,
  add column if not exists owner_device     text,
  add column if not exists unlocked_at      timestamptz,
  add column if not exists unlock_method    text check (unlock_method in ('partage','temoignage')),
  add column if not exists testimonial      text,
  add column if not exists testimonial_ok   boolean default false,
  add column if not exists founder_badge    boolean default false;

create index if not exists leads_referred_by_idx on public.leads(referred_by);

create table if not exists public.referral_clicks (
  id            uuid primary key default gen_random_uuid(),
  referral_code text not null,
  visitor_hash  text not null,
  created_at    timestamptz not null default now(),
  unique (referral_code, visitor_hash)
);
alter table public.referral_clicks enable row level security;
drop policy if exists "Admins read referral clicks" on public.referral_clicks;
create policy "Admins read referral clicks" on public.referral_clicks
  for select using (has_role(auth.uid(), 'admin'::app_role));

create table if not exists public.simulator_settings (
  key   text primary key,
  value jsonb not null
);
alter table public.simulator_settings enable row level security;
drop policy if exists "Anyone reads simulator settings" on public.simulator_settings;
create policy "Anyone reads simulator settings" on public.simulator_settings for select using (true);
drop policy if exists "Admins manage simulator settings" on public.simulator_settings;
create policy "Admins manage simulator settings" on public.simulator_settings
  for all using (has_role(auth.uid(), 'admin'::app_role));
insert into public.simulator_settings(key, value) values
  ('referral_threshold', '10'::jsonb),
  ('beta_start', '"2026-10-01"'::jsonb),
  ('beta_days', '21'::jsonb),
  ('paid_mode', 'false'::jsonb)
on conflict (key) do nothing;

create or replace function public._sim_score(
  _tension text, _exp text, _diplome text, _fr text, _passeport boolean
) returns jsonb language plpgsql immutable as $fn$
declare
  t int; e int; d int; f int; p int; total int; band text;
begin
  t := case _tension when 'Très haute' then 30 when 'Haute' then 25
                      when 'Moyenne-haute' then 20 when 'Croissante' then 20
                      when 'Moyenne' then 12 else 10 end;
  e := case _exp when '10+' then 25 when '5-10' then 22 when '2-5' then 15 when '0-2' then 5 else 0 end;
  d := case _diplome when 'MASTER' then 20 when 'BTS' then 20 when 'BAC_PRO' then 17
                      when 'CQP' then 15 when 'DQP' then 15 when 'AUCUN_EXP' then 8 else 5 end;
  f := case _fr when 'NATIF' then 15 when 'C1' then 15 when 'B2' then 13 when 'B1' then 10
                 when 'A2' then 5 when 'A1' then 3 else 0 end;
  p := case when _passeport then 10 else 0 end;
  total := t + e + d + f + p;
  band := case when total >= 75 then 'fort' when total >= 55 then 'reel'
               when total >= 40 then 'a_renforcer' else 'pas_encore' end;
  return jsonb_build_object(
    'total', total, 'band', band,
    'criteres', jsonb_build_array(
      jsonb_build_object('cle','tension',   'label','Demande du métier en France', 'points',t,'max',30),
      jsonb_build_object('cle','experience','label','Expérience professionnelle',  'points',e,'max',25),
      jsonb_build_object('cle','diplome',   'label','Qualification / diplôme',     'points',d,'max',20),
      jsonb_build_object('cle','francais',  'label','Niveau de français',          'points',f,'max',15),
      jsonb_build_object('cle','passeport', 'label','Passeport valide',            'points',p,'max',10)
    ));
end $fn$;

create or replace function public._sim_reco(_details jsonb, _metier public.metiers_minefop_rome)
returns jsonb language plpgsql immutable as $fn$
declare r jsonb := '[]'::jsonb; c jsonb;
begin
  for c in select * from jsonb_array_elements(_details->'criteres') loop
    if (c->>'points')::int < (c->>'max')::int * 0.6 then
      r := r || jsonb_build_array(case c->>'cle'
        when 'francais'   then 'Viser le niveau B1 minimum (idéalement B2) et passer un test officiel (TCF ou DELF) : c''est le levier le plus rapide pour gagner des points.'
        when 'experience' then 'Documenter chaque expérience (attestations d''employeur, photos de chantiers, références) : l''expérience prouvée compte plus que l''expérience déclarée.'
        when 'diplome'    then 'Faire authentifier et légaliser votre diplôme (' || coalesce(_metier.legalisation,'MINEFOP puis MINREX') || '). Sans qualification reconnue, viser un CQP du métier.'
        when 'passeport'  then 'Faire établir ou renouveler votre passeport maintenant : c''est souvent le délai le plus long du parcours.'
        when 'tension'    then 'Ce métier est moins demandé en France. Regardez les métiers proches à plus forte tension dans la même famille.'
      end);
    end if;
  end loop;
  if _metier.rome_code in ('J1506','J1501') then
    r := r || jsonb_build_array('Profession de santé réglementée : une reconnaissance ou équivalence de diplôme est obligatoire avant d''exercer en France.');
  end if;
  if jsonb_array_length(r) = 0 then
    r := jsonb_build_array('Profil solide : préparez votre dossier (CV au format français, diplôme légalisé, attestations) pour être présenté aux employeurs dès l''ouverture du recrutement AXIOM.');
  end if;
  return r;
end $fn$;

create or replace function public.get_simulation_result(_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l record; m public.metiers_minefop_rome; clicks int; seuil int; base jsonb;
begin
  select * into l from leads where result_token = _token;
  if not found then raise exception 'result_not_found'; end if;
  select * into m from metiers_minefop_rome where rome_code = l.rome_code limit 1;
  select count(*) into clicks from referral_clicks where referral_code = l.referral_code;
  select (value)::text::int into seuil from simulator_settings where key = 'referral_threshold';

  base := jsonb_build_object(
    'token', l.result_token, 'first_name', l.first_name, 'referral_code', l.referral_code,
    'score', l.score_v2, 'band', l.score_details->>'band',
    'metier', jsonb_build_object('rome_code', m.rome_code, 'titre', m.rome_title,
        'tension', m.niveau_tension, 'salaire', m.salaire_moyen_france),
    'pays', l.pays, 'clicks', clicks, 'threshold', coalesce(seuil,10),
    'unlocked', l.unlocked_at is not null, 'unlock_method', l.unlock_method,
    'founder', l.founder_badge, 'created_at', l.created_at);

  if l.unlocked_at is not null then
    base := base || jsonb_build_object(
      'criteres', l.score_details->'criteres',
      'recommandations', _sim_reco(l.score_details, m),
      'legalisation', m.legalisation, 'niveau_requis', m.niveau,
      'competences', to_jsonb(m.competences));
  end if;
  return base;
end $fn$;

create or replace function public.simulate_eligibility(
  _first_name text, _rome_code text, _experience text, _diplome text,
  _niveau_francais text, _passeport boolean, _pays text,
  _email_or_phone text, _rgpd boolean,
  _referred_by text default null, _device text default null,
  _utm_source text default null, _utm_medium text default null, _utm_campaign text default null
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  m public.metiers_minefop_rome; det jsonb; code text; lid uuid; tok uuid;
begin
  if not coalesce(_rgpd,false) then raise exception 'rgpd_required'; end if;
  if coalesce(length(trim(_email_or_phone)),0) < 6 or length(_email_or_phone) > 120 then raise exception 'contact_invalid'; end if;
  if coalesce(length(trim(_first_name)),0) = 0 or length(_first_name) > 60 then raise exception 'name_invalid'; end if;

  select * into m from metiers_minefop_rome where rome_code = _rome_code limit 1;
  if not found then raise exception 'metier_unknown'; end if;

  det := _sim_score(m.niveau_tension, _experience, _diplome, _niveau_francais, coalesce(_passeport,false));

  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    exit when length(code) = 6 and not exists (select 1 from leads where referral_code = code);
  end loop;

  insert into leads (email_or_phone, first_name, metier, rome_code, experience_bracket, diplome,
                     niveau_francais, passeport, pays, score_mock, score_v2, score_details,
                     rgpd_consent, status, referral_code, referred_by, owner_device,
                     utm_source, utm_medium, utm_campaign, founder_badge)
  values (trim(_email_or_phone), trim(_first_name), m.rome_title, m.rome_code, _experience, _diplome,
          _niveau_francais, coalesce(_passeport,false), _pays, (det->>'total')::int, (det->>'total')::int, det,
          true, 'a_contacter', code, nullif(upper(trim(_referred_by)),''), _device,
          _utm_source, _utm_medium, _utm_campaign, true)
  returning id, result_token into lid, tok;

  insert into funnel_events(event_name, rome_code, experience, source, metadata)
  values ('sim_completed', m.rome_code, _experience, 'simulateur_beta',
          jsonb_build_object('pays',_pays,'score',(det->>'total')::int,'referred_by',_referred_by,'utm_source',_utm_source));

  return get_simulation_result(tok);
end $fn$;

create or replace function public.track_referral_click(_code text, _visitor text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l record; n int; seuil int;
begin
  if _code is null or _visitor is null or length(_visitor) < 8 or length(_visitor) > 128 then
    return jsonb_build_object('ok', false);
  end if;
  select * into l from leads where referral_code = upper(trim(_code));
  if not found then return jsonb_build_object('ok', false); end if;
  if l.owner_device is not null and l.owner_device = _visitor then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;

  insert into referral_clicks(referral_code, visitor_hash) values (l.referral_code, _visitor)
  on conflict do nothing;

  select count(*) into n from referral_clicks where referral_code = l.referral_code;
  select (value)::text::int into seuil from simulator_settings where key = 'referral_threshold';
  if n >= coalesce(seuil,10) and l.unlocked_at is null then
    update leads set unlocked_at = now(), unlock_method = 'partage' where id = l.id;
    insert into funnel_events(event_name, rome_code, source, metadata)
    values ('sim_unlocked', l.rome_code, 'simulateur_beta', jsonb_build_object('method','partage'));
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

create or replace function public.submit_testimonial(_token uuid, _text text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l record;
begin
  if coalesce(length(trim(_text)),0) < 40 or length(_text) > 2000 then raise exception 'testimonial_too_short'; end if;
  select * into l from leads where result_token = _token;
  if not found then raise exception 'result_not_found'; end if;
  update leads set testimonial = trim(_text),
         unlocked_at = coalesce(unlocked_at, now()),
         unlock_method = coalesce(unlock_method, 'temoignage')
   where id = l.id;
  insert into funnel_events(event_name, rome_code, source, metadata)
  values ('sim_unlocked', l.rome_code, 'simulateur_beta', jsonb_build_object('method','temoignage'));
  return get_simulation_result(_token);
end $fn$;

revoke all on function public._sim_score(text,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public._sim_reco(jsonb, public.metiers_minefop_rome) from public, anon, authenticated;
grant execute on function public.simulate_eligibility(text,text,text,text,text,boolean,text,text,boolean,text,text,text,text,text) to anon, authenticated;
grant execute on function public.get_simulation_result(uuid) to anon, authenticated;
grant execute on function public.track_referral_click(text,text) to anon, authenticated;
grant execute on function public.submit_testimonial(uuid,text) to anon, authenticated;

create or replace view public.simulator_beta_kpis with (security_invoker = true) as
select date_trunc('week', created_at)::date as semaine,
       pays,
       count(*)                                        as tests_termines,
       count(*) filter (where unlocked_at is not null) as deblocages,
       count(*) filter (where unlock_method='partage')    as deblocages_partage,
       count(*) filter (where unlock_method='temoignage') as deblocages_temoignage,
       count(*) filter (where referred_by is not null)    as venus_par_parrainage,
       round(avg(score_v2))                            as score_moyen
  from public.leads
 where score_v2 is not null
 group by 1,2;