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
} satisfies ToolSet;
