
-- Function to match talents with job offers based on skills, french level, and experience
-- Returns talent profiles with a computed compatibility score
CREATE OR REPLACE FUNCTION public.match_talents_for_offer(
  _required_skills text[],
  _min_score numeric DEFAULT 50,
  _limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  country text,
  french_level text,
  experience_years integer,
  skills text[],
  available boolean,
  compatibility_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_count integer;
BEGIN
  required_count := COALESCE(array_length(_required_skills, 1), 0);
  
  IF required_count = 0 THEN
    -- No required skills, return talents sorted by experience
    RETURN QUERY
    SELECT 
      tp.id, tp.user_id, tp.full_name, tp.country, tp.french_level,
      tp.experience_years, tp.skills, tp.available,
      LEAST(100, (
        -- French level bonus (up to 20 points)
        CASE tp.french_level
          WHEN 'natif' THEN 20
          WHEN 'C2' THEN 18
          WHEN 'C1' THEN 15
          WHEN 'B2' THEN 12
          WHEN 'B1' THEN 8
          WHEN 'A2' THEN 4
          WHEN 'A1' THEN 2
          ELSE 0
        END +
        -- Experience bonus (up to 20 points)
        LEAST(20, COALESCE(tp.experience_years, 0) * 2) +
        -- Base score for available talents
        CASE WHEN tp.available = true THEN 30 ELSE 10 END
      ))::numeric AS compatibility_score
    FROM talent_profiles tp
    WHERE tp.available = true
    ORDER BY compatibility_score DESC
    LIMIT _limit_count;
  ELSE
    RETURN QUERY
    SELECT 
      tp.id, tp.user_id, tp.full_name, tp.country, tp.french_level,
      tp.experience_years, tp.skills, tp.available,
      LEAST(100, (
        -- Skills match (up to 60 points) — main factor
        (COALESCE(array_length(
          ARRAY(
            SELECT unnest(COALESCE(tp.skills, '{}')) 
            INTERSECT 
            SELECT unnest(_required_skills)
          ), 1
        ), 0)::numeric / required_count::numeric) * 60 +
        -- French level bonus (up to 20 points)
        CASE tp.french_level
          WHEN 'natif' THEN 20
          WHEN 'C2' THEN 18
          WHEN 'C1' THEN 15
          WHEN 'B2' THEN 12
          WHEN 'B1' THEN 8
          WHEN 'A2' THEN 4
          WHEN 'A1' THEN 2
          ELSE 0
        END +
        -- Experience bonus (up to 20 points)
        LEAST(20, COALESCE(tp.experience_years, 0) * 2)
      ))::numeric AS compatibility_score
    FROM talent_profiles tp
    WHERE tp.available = true
    ORDER BY compatibility_score DESC
    LIMIT _limit_count;
  END IF;
END;
$$;
