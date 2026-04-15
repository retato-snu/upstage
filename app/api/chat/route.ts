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

# 작업 절차
1. ** 외부 검색 ** : 단어의 의미가 확실치 않다면, \`webSearch\` 도구를 사용하여 전문용어의 뜻을 정확히 파악합니다.
2. ** 내부 검증** :  \'checkConsistency\` 도구를 사용하여 우리 위원회의 기존 DB에 유사한 용어가 있는지 확인힙니다.
3. ** 총돌 해결 및 종합** 
  -내부 DB에 결과가 있다면, 외부 검색 결과보다 ** 내부 데이터를 우선**하여 번역어를 제안합니다.
  - 내부 데이터베이스에 결과가 없다면, 외부 검색 결과를 바탕으로 쉬운 한국어로 짧게 설명합니다.
3. 우리 위원회 원칙에 맞는 새로운 쉬운 번역어 브레인스토밍 후보를 6개 이상 생성합니다.
4. 각 후보의 번역 의도, 장단점, 다른 단어의 쉬운 번역과의 연관성을 분석합니다.
5. 사용자에게 제안할 최종 후보 3개를 선정합니다. 비교적 안정적인 후보부터 감각적이고 실험적인 후보까지 다양하게 포함합니다.
6. 최종 후보들을 활용한 예문을 하나씩 제시합니다.

# 출력
이미 존재하는 단어라면 간단하게 이미 존재하는 용어라고 안내하면 됩니다.
새로운 단어를 제안할때는 내부적으로는 과감하게 후보를 탐색하되, 출력은 간결하고 선명하게 아래와 같이 정리합니다.
**절대로** 표를 출력하지 않습니다. 작은 화면에서도 잘 읽히도록 불렛 리스트만을 활용해서 비교합니다.

1. 뜻 설명
2. 최종 후보 3개를 불렛 리스트로 나열하며 각 후보의 번역 의도, 장단점, 기존에 제안된 다른 관련 단어의 번역과의 연관성 비교
3. 각 번역어의 활용 예문
`;
