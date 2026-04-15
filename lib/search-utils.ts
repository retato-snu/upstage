import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.UPSTAGE_API_KEY;
const upstage = createOpenAICompatible({
  name: "upstage",
  apiKey,
  baseURL: "https://api.upstage.ai/v1",
});

export async function generateSearchQuery(intent: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: upstage.chatModel("solar-1-mini-chat"),
      system: `당신은 검색어 최적화 전문가입니다.
사용자의 질문이나 단어를 Google 검색에 가장 적합한 쿼리로 변환하세요.
단순히 던어를 나열하기보다는 정의, 기술 스택, 최신 동향 등을 포함하는 구체적인 쿼리를 생성하세요.
출력은 오직 최적화된 검색 쿼리 문자열만 반환하세요. 예: "Monad의 정의와 원리`,
      prompt: `Translate this intent into an optimized search query: "${intent}`,
    });
    return text.trim().replace(/^"|"$/g, "");
  } catch (error) {
    console.error("Search query generation error:", error);
    return intent;
  }
}

export async function summarizeSearchResults(
  query: string,
  optimizedQuery: string,
  results: { title: string; snippet: string }[],
): Promise<string> {
  if (results.length === 0) return "검색 결과를 찾을 수 없습니다.";

  const context = results
    .map((r, i) => `[출처 ${i + 1}: ${r.title}]\n${r.snippet}`)
    .join("\n\n");

  try {
    const { text } = await generateText({
      model: upstage.chatModel("solar-1-mini-chat"),
      system: `당신은 웹 검색 결과를 종합하여 다른 LLM에게 판단 근거로 사용할 수 있게 정확하고 간결한 정보를 제공하는 AI 어시스턴트입니다.
            제공된 '검색 결과'을 바탕으로 사용자의 '원래 질문'에 대해 한국어로 요약해 설명하세요.
- 사실에 기반하여 답하고, 정보가 부족하다면 아는 선에서만 답변하세요.
- 마크다운 형식을 사용하여 가독성 있게 작성하여.
- 전문 용어의 경우 쉬운 우리말 번역의 맥락의 고려하세요.`,
      prompt: `사용자 질문: ${query}
최적화된 쿼리: ${optimizedQuery}

검색 결과:
${context}

위 검색 결과를 종합하여, 질문에 대한 명확한 요약을 작성하세요.`,
    });
    return text.trim();
  } catch (error) {
    console.error("Search result summarization error:", error);
    return "결과를 요약하는 중에 오류가 발생했습니다. 아래 출처 리스트를 참고 해주세요.";
  }
}
