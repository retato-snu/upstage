import { generateText, ModelMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const apiKey = process.env.OPENROUTER_API_KEY;
const openrouter = createOpenRouter({ apiKey });

export async function POST(req: Request) {
  const { messages }: { messages: ModelMessage[] } = await req.json();

  const { response } = await generateText({
    model: openrouter.chat("upstage/solar-pro-3:free"),
    system: "You are a helpful assistant.",
    messages,
  });

  return Response.json({ messages: response.messages });
}
