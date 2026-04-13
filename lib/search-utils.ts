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
