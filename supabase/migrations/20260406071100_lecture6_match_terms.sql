-- 1. pg_trgm 익스텐션 활성화 (Fuzzy 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. AI의 checkConsistency 도구를 위한 전용 검색 함수 생성
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
    j.name % search_query OR t.name % search_query -- pg_trgm 퍼지 검색
  ORDER BY 
    similarity_score DESC
  LIMIT 5; -- AI 컨텍스트 용량 조절
END;
$$ LANGUAGE plpgsql;
