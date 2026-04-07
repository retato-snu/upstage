import { tool, ToolSet } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MatchTermResult {
  term_id: string;
  jargon_term: string;
  suggested_translation: string;
  similarity_score: number;
}

export const tools = {
  checkConsistency: tool({
    description: "내부 데이터베이스에서 용어의 일관성을 확인합니다.",
    inputSchema: z.object({
      word: z.string().describe("확인할 단어"),
    }),
    execute: async ({ word }) => {
      try {
        const { data, error } = await (supabase as any).rpc("match_terms", {
          search_query: word,
        }) as { data: MatchTermResult[] | null, error: any };

        if (error) {
          console.error("Database RPC error:", error);
          return {
            results: [],
            message: "내부 데이터베이스 검색 중 오류가 발생했습니다.",
          };
        }

        if (!data || data.length === 0) {
          return {
            results: [],
            message: "내부 데이터베이스에 매칭되는 용어가 없습니다.",
          };
        }

        return {
          results: data.map((item) => ({
            term: item.jargon_term,
            translation: item.suggested_translation,
            score: item.similarity_score,
          })),
          message: `${data.length}개의 유사한 용어를 찾았습니다.`,
        };
      } catch (error) {
        console.error("checkConsistency error:", error);
        return {
          results: [],
          message: "내부 데이터베이스 검색 중 알 수 없는 오류가 발생했습니다.",
        };
      }
    },
  }),
  lookupDefinition: tool({
    description: "새로운 전문 용어의 정의와 설명을 웹에서 검색합니다.",
    inputSchema: z.object({
      word: z.string().describe("검색할 단어"),
    }),
    execute: async ({ word }) => {
      // 실제 API 호출을 시뮬레이션하기 위한 지연 시간
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey || !cx) {
        return {
          definition: `${word}에 대한 검색 결과가 없습니다. (API 키 설정 필요)`,
          link: "#",
        };
      }

      try {
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(word + " 정의")}`
        );
        const data = await response.json();
        const firstResult = data.items?.[0];

        return {
          definition: firstResult?.snippet || `${word}에 대한 정의를 찾을 수 없습니다.`,
          link: firstResult?.link || "",
        };
      } catch (error) {
        console.error("Search API error:", error);
        return {
          definition: "검색 중 오류가 발생했습니다.",
          link: "",
        };
      }
    },
  }),
} satisfies ToolSet;

