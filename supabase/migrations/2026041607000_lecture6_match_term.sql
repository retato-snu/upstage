CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION match_terms(search_query text)
RETURNS TABLE (
  term_id uuid,
  jargon_term text,
  suggested_translation text,
  similarity_score real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id AS term_id,
    j.name AS jargon_term,
    t.name AS suggested_translation,
    GREATEST(similarity(j.name, search_query), similarity(t.name, search_query))::real AS similarity_score
  FROM 
    jargon j
  LEFT JOIN 
    translation t ON j.id = t.jargon_id
  WHERE 
    j.name % search_query OR t.name % search_query 
  ORDER BY 
    similarity_score DESC
  LIMIT 5; 
END;
$$ LANGUAGE plpgsql;
