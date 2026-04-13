import { tool, type ToolSet } from "ai";
import z from "zod";
import { generateSearchQuery } from "@/lib/search-utils";
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

      const apiKey = process.env.SERPER_API_KEY;

      if (!apiKey) {
        return {
          definition: `${word}에 대한 검색 결과가 없습니다. (Serper API 키 설정 필요)`,
          link: "#",
        };
      }

      try {
        // Serper API 호출 (POST 방식)
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: word + " 정의",
            hl: "ko", // 한국어 검색 결과 우선
            gl: "kr", // 한국 지역 검색 결과 우선
          }),
        });

        if (!response.ok) {
          throw new Error(`Serper API error: ${response.status}`);
        }

        const data = await response.json();
        const firstResult = data.organic?.[0];

        return {
          definition:
            firstResult?.snippet || `${word}에 대한 정의를 찾을 수 없습니다.`,
          link: firstResult?.link || "",
        };
      } catch (error) {
        console.error("Serper API error:", error);
        return {
          definition: "검색 중 오류가 발생했습니다.",
          link: "",
        };
      }
    },
  }),
  webSearch: tool({
    description: "고급 웹 검색을 통해 전문 용어에 대한 최신 정보와 다양한 출처를 확인합니다.",
    inputSchema: z.object({
      query: z.string().describe("검색할 핵심 단어 또는 문장 (사용자의 원래 의도)"),
    }),
    execute: async ({ query }) => {
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        throw new Error("SERPER_API_KEY is not set");
      }

      // 1. SLM을 이용한 쿼리 최적화
      const optimizedQuery = await generateSearchQuery(query);
      console.log(`Searching for: "${optimizedQuery}" (Original: "${query}")`);

      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: optimizedQuery,
            hl: "ko",
            gl: "kr",
            num: 5, // 5개의 결과 요청
          }),
        });

        if (!response.ok) {
          throw new Error(`Serper API error: ${response.status}`);
        }

        const data = await response.json();
        
        // 검색 결과 구조화
        const results = (data.organic || []).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}&sz=128`,
        }));

        return {
          optimizedQuery,
          results,
        };
      } catch (error) {
        console.error("WebSearch tool error:", error);
        return {
          optimizedQuery,
          results: [],
          error: "검색 중 오류가 발생했습니다.",
        };
      }
    },
  }),
  findRelatedWords: tool({
    description:
      "Finds words that are semantically related to the given word and provides suggested easy Korean translation of those words",
    inputSchema: z.object({
      word: z.string().describe("The word to find related words for"),
    }),
    outputSchema: z.array(
      z.object({
        word: z.string().describe("The word releated to the given word"),
        translations: z
          .array(z.string())
          .describe("The array of suggested easy Korean translations"),
      }),
    ),
    execute: ({ word }) => {
      if (word.includes("sync"))
        return [
          {
            word: "synchronous programming",
            translations: [
              "차례있는 프로그램짜기",
              "지켜보기 프로그래밍",
              "합맞추기 프로그래밍",
              "다하고넘어가는 프로그램짜기",
              "기다리는 프로그램 짜기",
              "정박자 프로그래밍",
            ],
          },
        ];
      else return [];
    },
  }),
} satisfies ToolSet;
