import { tool, ToolSet } from "ai";
import { z } from "zod";

export const tools = {
  findRelatedWords: tool({
    description:
      "Finds words that are related in meaning to the given word and provides suggested translations in Korean.",
    inputSchema: z.object({
      word: z.string().describe("The word to find related words for."),
    }),
    execute: async ({ word }) => {
      return {
        relatedWords: [
          { word: "coverage", translation: "덮이" },
          { word: "abstraction", translation: "속내용감추기" },
        ],
      };
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

