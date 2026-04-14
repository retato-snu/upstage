import { tool, type ToolSet } from "ai";
import z from "zod";
import { generateSearchQuery } from "@/lib/search-utils";

export const tools = {
  lookupDefinition: tool({
    description: "새로운 전문 용어의 정의와 설명을 웹에서 검색합니다.",
    inputSchema: z.object({
      word: z.string().describe("검색할 단어"),
    }),
    outputSchema: z.object({
      definition: z.string().describe("단어의 정의"),
      link: z.string().describe("출처 링크"),
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
    outputSchema: z.object({
      optimizedQuery: z.string().describe("최적화된 검색 쿼리"),
      results: z.array(
        z.object({
          title: z.string().describe("페이지 제목"),
          link: z.string().describe("페이지 링크"),
          snippet: z.string().describe("검색 결과 요약"),
        })
      ).describe("검색 결과 목록"),
      error: z.string().optional().describe("에러 메시지 (발생 시)"),
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
        }));

        return {
          optimizedQuery,
          results,
          error: undefined,
        };
      } catch (error) {
        console.error("WebSearch tool error:", error);
        return {
          optimizedQuery: optimizedQuery || query,
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
