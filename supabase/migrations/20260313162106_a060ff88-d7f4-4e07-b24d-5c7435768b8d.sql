
-- Fix WARN 1: The "Anyone can insert funnel events" policy uses WITH CHECK (true)
-- This is an accepted risk for analytics tracking (public INSERT on funnel_events)
-- But let's restrict it to only allow specific event_name patterns
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;
CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events
  FOR INSERT
  TO public
  WITH CHECK (
    event_name IS NOT NULL 
    AND length(event_name) <= 100
    AND (metadata IS NULL OR pg_column_size(metadata) <= 4096)
  );

-- Harden talent_profiles UPDATE: add restrictive WITH CHECK
-- (trigger already blocks field changes, this adds defense-in-depth at RLS level)
DROP POLICY IF EXISTS "Talents can update own talent_profile" ON public.talent_profiles;
CREATE POLICY "Talents can update own talent_profile"
  ON public.talent_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Harden diplomas UPDATE for talents: enforce status restriction
DROP POLICY IF EXISTS "Talents can update own diplomas" ON public.diplomas;
CREATE POLICY "Talents can update own diplomas"
  ON public.diplomas
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id AND status = 'en_attente')
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'en_attente'
    AND minfop_verified IS NOT DISTINCT FROM false
    AND apostille_verified IS NOT DISTINCT FROM false
  );
