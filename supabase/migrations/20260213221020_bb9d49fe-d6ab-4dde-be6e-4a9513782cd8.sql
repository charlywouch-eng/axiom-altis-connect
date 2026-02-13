
-- Add tension columns to existing table
ALTER TABLE public.metiers_minefop_rome
  ADD COLUMN IF NOT EXISTS metier_tension_fr TEXT,
  ADD COLUMN IF NOT EXISTS niveau_tension TEXT DEFAULT 'Moyenne',
  ADD COLUMN IF NOT EXISTS score_matching INTEGER DEFAULT 5;
