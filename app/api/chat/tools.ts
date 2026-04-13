import { tool, type ToolSet } from "ai";
import z from "zod";

export const tools = {
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
