-- Add is_premium flag to talent_profiles
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- Add payment_type to track which product was purchased
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS premium_unlocked_at timestamp with time zone;
