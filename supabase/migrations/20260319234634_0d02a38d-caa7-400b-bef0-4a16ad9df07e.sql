CREATE OR REPLACE FUNCTION public.match_talents_for_offer(_required_skills text[], _min_score numeric DEFAULT 50, _limit_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, user_id uuid, full_name text, country text, french_level text, experience_years integer, skills text[], available boolean, compatibility_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  required_count integer;
BEGIN
  required_count := COALESCE(array_length(_required_skills, 1), 0);
  
  IF required_count = 0 THEN
    RETURN QUERY
    SELECT 
      tp.id, tp.user_id, tp.full_name, tp.country, tp.french_level,
      tp.experience_years, tp.skills, tp.available,
      LEAST(100, (
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
        LEAST(25, COALESCE(tp.experience_years, 0) * 3) +
        CASE WHEN tp.available = true THEN 30 ELSE 10 END +
        CASE WHEN COALESCE(tp.experience_years, 0) >= 5 THEN 15 ELSE 0 END
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
        (COALESCE(array_length(
          ARRAY(
            SELECT unnest(COALESCE(tp.skills, '{}')) 
            INTERSECT 
            SELECT unnest(_required_skills)
          ), 1
        ), 0)::numeric / required_count::numeric) * 50 +
        CASE tp.french_level
          WHEN 'natif' THEN 15
          WHEN 'C2' THEN 13
          WHEN 'C1' THEN 10
          WHEN 'B2' THEN 8
          WHEN 'B1' THEN 5
          WHEN 'A2' THEN 3
          WHEN 'A1' THEN 1
          ELSE 0
        END +
        LEAST(20, COALESCE(tp.experience_years, 0) * 2) +
        CASE WHEN COALESCE(tp.experience_years, 0) >= 5 THEN 15 ELSE 0 END
      ))::numeric AS compatibility_score
    FROM talent_profiles tp
    WHERE tp.available = true
    ORDER BY compatibility_score DESC
    LIMIT _limit_count;
  END IF;
END;
$function$;