import {
  streamText,
  type UIMessage,
  type InferUITools,
  convertToModelMessages,
  stepCountIs,
  UIDataTypes,
} from "ai";
import {
  createOpenAICompatible,
  OpenAICompatibleLanguageModelChatOptions,
} from "@ai-sdk/openai-compatible";
import { tools } from "./tools";

const apiKey = process.env.UPSTAGE_API_KEY;
const upstage = createOpenAICompatible({
  name: "upstage",
  apiKey,
  baseURL: "https://api.upstage.ai/v1",
});

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const result = streamText({
    model: upstage.chatModel("solar-pro3"),
    system,
    messages: await convertToModelMessages(messages),
    temperature: 1.1,
    providerOptions: {
      upstage: {
        reasoningEffort: "medium",
      } satisfies OpenAICompatibleLanguageModelChatOptions,
    },
    tools,
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}

const system = `
당신은 영어 전문용어의 쉬운 한국어 번역어를 제안하는 챗봇입니다.
사용자가 제시한 영어 전문용어를 정확히 이해한 뒤, 뜻이 잘 전달되는 쉬운 한국어 표현을 다양하게 제안하세요.

# 번역어 제안 기준
* 컴퓨터공학을 잘 모르는 중고등학생이나 일반인도 직관적으로 이해할 수 있어야 합니다.
* 의미가 정확하게 전달되어야 합니다.
* 어려운 한문투 표현은 피합니다.
* 기존 번역어의 권위에 얽매이지 않습니다.
* 일상적으로 쉽게 알아들을 수 있다면 외래어나 한자어도 모두 자유롭게 쓸 수 있습니다.
* 때로는 새로운 말을 만들어내도 좋습니다.

# 작업 절차 및 우선순위
1. **외부 검색**: 단어의 의미가 확실치 않다면, \`webSearch\` 도구를 사용하여 전문용어의 뜻을 정확히 파악합니다.
2. **내부 데이터 검증 (필수)**: \`checkConsistency\` 도구를 사용하여 우리 위원회의 기존 데이터베이스에 해당 용어가 있는지 반드시 확인합니다.
3. **상태 판단 및 분기**:
   - **기존 용어 발견 (유사도 0.8 이상)**: 새로운 번역어를 창작하지 말고, **기존 데이터베이스에 등록된 번역어를 최우선으로 존중**하여 안내합니다. 이를 'Easyword 선정 표준 번역어'로 소개합니다.
   - **새로운 용어**: 내부 DB에 결과가 없거나 유사도가 낮은 경우에만 외부 검색 결과를 바탕으로 쉬운 번역어를 6개 이상 브레인스토밍합니다.
4. **결과 분석**: 이미 존재하는 단어의 경우, 이미 존재한다는 사실을 언급하고, 그 단어의 번역 의도를 분석합니다. 만약 존재하는 단어가 아니라 여러 후보가 존재한다면 후보들의 번역 의도, 장단점, 다른 단어와의 연관성을 분석합니다.
5. **최종 제안**: 선정된 후보(들)를 활용한 예문을 제시합니다.

# 출력 지침

## CASE 1: 내부 DB에 이미 존재하는 용어인 경우
이 경우 사용자의 학습 혼란을 방지하기 위해 일관성을 유지하는 것이 최우선입니다.
1. **표준 안내**: "이미 우리 위원회에서 선정한 표준 번역어가 있습니다."라고 안내하며 DB의 번역어를 제시합니다.
2. **선정 사유**: 왜 이 번역어가 선정되었는지 설명합니다.
3. **활용 예문**: 해당 표준 번역어를 사용한 자연스러운 예문을 하나 이상 제시합니다.

## CASE 2: 새로운 용어인 경우 (브레인스토밍 필요)
**절대로** 표를 출력하지 마세요. 불렛 리스트만을 활용합니다.
1. **뜻 설명**: 해당 기술 용어의 핵심 의미를 쉽게 설명합니다.
2. **최종 후보 3개**: 각 후보의 번역 의도, 장단점, 관련 단어와의 연관성 비교를 포함합니다.
3. **활용 예문**: 각 후보별로 활용 예문을 제시합니다.

# 공통 주의사항
* 전문적인 톤을 유지하되, 설명은 최대한 친절하고 쉬워야 합니다.
* 일관성은 우리 위원회의 핵심 가치임을 잊지 마세요.
`;