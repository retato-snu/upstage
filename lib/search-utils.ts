import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey =
  process.env.SOLAR_API_KEY ||
  process.env.SOLAR_LLM_API_KEY ||
  process.env.UPSTAGE_API_KEY;

const upstage = createOpenAICompatible({
  name: "upstage",
  apiKey,
  baseURL: "https://api.upstage.ai/v1",
});

/**
 * SLM을 사용하여 사용자의 의도를 검색 최적화 쿼리로 변환합니다.
 * @param intent 사용자의 원래 질문이나 단어
 * @returns 최적화된 검색 쿼리
 */
export async function generateSearchQuery(intent: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: upstage.chatModel("solar-1-mini-chat"),
      system: `당신은 검색어 최적화 전문가입니다. 
사용자의 질문이나 단어를 Google 검색에 가장 적합한 키워드 중심의 쿼리로 변환하세요.
단순히 단어를 나열하기보다는 정의, 기술 스택, 최신 동향 등을 포함하는 구체적인 쿼리를 생성하세요.
출력은 오직 최적화된 검색 쿼리 문자열만 반환하세요. 예: "RAG 정의 및 작동 원리 기술 스택"`,
      prompt: `Translate this intent into an optimized search query: "${intent}"`,
    });
    return text.trim().replace(/^"|"$/g, ""); // 따옴표 제거
  } catch (error) {
    console.error("Search query generation error:", error);
    return intent; // 실패 시 원본 의도 반환
  }
}
/**
 * SLM을 사용하여 검색 결과의 스니펫들을 종합하고 요약합니다.
 * @param query 사용자의 원래 질문
 * @param optimizedQuery 최적화된 검색 쿼리
 * @param results 검색 결과 목록 (title, snippet 포함)
 * @returns 요약된 답변 문구
 */
export async function summarizeSearchResults(
  query: string,
  optimizedQuery: string,
  results: { title: string; snippet: string }[]
): Promise<string> {
  if (results.length === 0) return "검색 결과를 찾을 수 없습니다.";

  const context = results
    .map((r, i) => `[출처 ${i + 1}: ${r.title}]\n${r.snippet}`)
    .join("\n\n");

  try {
    const { text } = await generateText({
      model: upstage.chatModel("solar-1-mini-chat"),
      system: `당신은 웹 검색 결과를 종합하여 사용자에게 정확하고 간결한 정보를 제공하는 AI 어시스턴트입니다.
제공된 '검색 결과 문맥'을 바탕으로 사용자의 '원래 질문'에 대해 한국어로 요약해 설명하세요.
- 사실에 기반하여 답변하고, 정보가 부족하다면 아는 선에서만 답변하세요.
- 마크다운 형식을 사용하여 가독성 있게 작성하세요.
- 전문 용어의 경우 쉬운 우리말 번역의 맥락을 고려하세요.`,
      prompt: `원래 질문: ${query}
최적화된 쿼리: ${optimizedQuery}

검색 결과 문맥:
${context}

위 답변을 종합하여 질문에 대한 명확한 요약을 작성하세요.`,
    });
    return text.trim();
  } catch (error) {
    console.error("Search result summarization error:", error);
    return "결과를 요약하는 중에 오류가 발생했습니다. 아래 출처 리스트를 참고해 주세요.";
  }
}
