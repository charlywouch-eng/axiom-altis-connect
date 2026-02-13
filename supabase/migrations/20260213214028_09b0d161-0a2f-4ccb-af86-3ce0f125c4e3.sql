
-- Add verification columns to talent_profiles
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS visa_status text NOT NULL DEFAULT 'en_attente',
  ADD COLUMN IF NOT EXISTS apostille_date date,
  ADD COLUMN IF NOT EXISTS rome_code text,
  ADD COLUMN IF NOT EXISTS rome_label text,
  ADD COLUMN IF NOT EXISTS compliance_score integer NOT NULL DEFAULT 0;

-- Enable realtime for talent_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.talent_profiles;
