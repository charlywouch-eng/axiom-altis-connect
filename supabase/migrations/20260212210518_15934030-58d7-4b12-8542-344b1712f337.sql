-- Add talent-specific columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS french_level TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';