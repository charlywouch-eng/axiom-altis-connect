-- Create talent_profiles table for matching
CREATE TABLE public.talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  country TEXT,
  french_level TEXT,
  experience_years INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  score NUMERIC(5,2) DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- Talents can manage their own profile
CREATE POLICY "Talents can view own talent_profile"
  ON public.talent_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Talents can insert own talent_profile"
  ON public.talent_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Talents can update own talent_profile"
  ON public.talent_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Entreprises can view all talent profiles (for matching)
CREATE POLICY "Entreprises can view talent_profiles"
  ON public.talent_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'entreprise'::app_role));

-- Admins can view all
CREATE POLICY "Admins can view all talent_profiles"
  ON public.talent_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_talent_profiles_updated_at
  BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();