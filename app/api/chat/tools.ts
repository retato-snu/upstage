import {
  generateSearchQuery,
  summarizeSearchResults,
} from "@/lib/search-utils";
import { createClient } from "@/lib/supabase/server";
import { tool, type ToolSet } from "ai";
import { Database } from "@/lib/supabase/types";
import z from "zod";

const superbase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    outputSchema: z.object({
      results: z.string().describe("결과들"),
      message: z.string().describe("상태 메세지"),
    }),
    excute: async ({ word }) => {
      try {
        const { data, error } = (await (superbase as any).rpc("match_terms", {
          search_query: word,
        })) as { data: MatchTermResult[] | null; error: any };
        if (error) {
          console.error("Database RPC error:", error);
          return {
            results: [],
            message: "내부 데이터베이스 검색 중 오류가 발생했습니다",
          };
        }
        if (data || data.length === 0) {
          return {
            results: [],
            message: "내부 데이터 베이스에 매칭되는 용어가 없습니다",
          };
        }
        return {
          results: data.map((item) => ({
            term: item.jargon_term.
            translation: item.suggested_translation,
            score: item.similarity_score,
          })),
          message: `${data.length}개의 유사한 용어를 찾았습니다.`
        }
      } catch (error) {
        console.error("checkConsistency error:", error);
        return{
          results:[],
          message: "내부 데이터베이스 검색 중 알 수 없는 오류가 발생했습니다.",
        }
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
  lookupDefinition: tool({
    description:
      "새로운 전문 용어나 어려운 단어의 정의와 설명을 웹에서 최신 정보로 검색합니다. 단어의 의미가 불확실할 때 사용하세요.",
    inputSchema: z.object({
      word: z.string().describe("검색할 단어(예시: monad)"),
    }),
    outputSchema: z.object({
      definition: z.string().describe("단어의 정의"),
      link: z.string().describe("출처 링크"),
    }),
    execute: async ({ word }) => {
      const apiKey = process.env.SERPER_API_KEY;

      if (!apiKey) {
        return {
          definition: `${word}에 대한 검색 결과가 없습니다.(Serper API 키 설정 필요)`,
          link: "#",
        };
      }
      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: word + " definition",
            hl: "en",
            gl: "us",
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
    description:
      "고급 웹 검색을 통해 전문 용어에 대한 최신 정보와 다양한 출처를 확인하고 요약합니다.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("검색하고 싶은 내용에 대한 핵심 문장 또는 단어"),
    }),
    outputSchema: z.object({
      optimizedQuery: z.string().describe("최적화된 검색 쿼리"),
      summary: z.string().describe("검색 결과 종합 요약"),
      results: z
        .array(
          z.object({
            title: z.string().describe("페이지 제목"),
            link: z.string().describe("페이지 링크"),
            snippet: z.string().describe("검색 페이지 요약"),
          }),
        )
        .describe("참고한 검색 결과 목록"),
    }),
    execute: async ({ query }) => {
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        throw new Error("SERPER_API_KEY is not set");
      }
      const optimizedQuery = await generateSearchQuery(query);

      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: optimizedQuery,
            hl: "en",
            gl: "us",
          }),
        });

        if (!response.ok) {
          throw new Error(`Serper API error: ${response.status}`);
        }

        const data = await response.json();
        const results = (data.organic || []).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }));
        const summary = await summarizeSearchResults(
          query,
          optimizedQuery,
          results,
        );

        return {
          optimizedQuery,
          summary,
          results,
        };
      } catch (error) {
        console.error("WebSearch tool error:", error);
        return {
          optimizedQuery: optimizedQuery || query,
          summary: "검색 결과를 요약하는 도중 오류가 발생했습니다.",
          results: [],
        };
      }
    },
  }),
} satisfies ToolSet;
