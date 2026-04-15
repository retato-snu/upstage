"use client";

import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BotIcon,
  UserIcon,
  RefreshCwIcon,
  SquareIcon,
  CornerDownLeftIcon,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { type ChatMessage } from "@/app/api/chat/route";

export default function ChatAssistant() {
  const { messages, status, sendMessage, stop, regenerate } =
    useChat<ChatMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
      experimental_throttle: 100,
    });
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInput("");
    await sendMessage({
      text: input,
    });
  };

  const divRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (status === "streaming")
      divRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex h-full max-h-[60vh] flex-col gap-4">
      <div className="overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="flex">
            <div className="flex-0">
              {message.role === "user" ? (
                <UserIcon className="mr-2 inline-block size-3.5" />
              ) : (
                <BotIcon className="mr-2 inline-block size-3.5" />
              )}
            </div>
            <div className="prose min-w-0">
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  <MyMarkdown key={index}>{part.text}</MyMarkdown>
                ) : part.type === "reasoning" ? (
                  <details
                    key={index}
                    className="rounded-xl border-1 bg-gray-100 p-4 text-gray-500"
                  >
                    <summary>생각하는 중...</summary>
                    <MyMarkdown key={index}>{part.text}</MyMarkdown>
                  </details>
                ) : part.type === "tool-findRelatedWords" ? (
                  <details
                    key={index}
                    className="rounded-xl border-1 bg-gray-100 p-4 text-gray-500"
                  >
                    <summary>연관 단어 찾는 중...</summary>
                    <b>{part.input?.word} 관련 단어</b>
                    <ul>
                      {part.output?.map(
                        ({ word, translations }) =>
                          `${word}: ${translations.join(", ")}`,
                      )}
                    </ul>
                  </details>
                ) : part.type === "tool-lookupDefinition" ? (
                  <details
                    key={index}
                    className="rounded-xl border-1 bg-gray-100 p-4 text-gray-500"
                  >
                    <summary>웹에서 정의 검색 중...</summary>
                    <b>{part.input?.word} 정의 검색 결과</b>
                    <ul>
                      <li>{part.output?.definition}</li>
                      {part.output?.link && (
                        <li>
                          <a
                            href={part.output.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            출처 확인하기
                          </a>
                        </li>
                      )}
                    </ul>
                  </details>
                ) : part.type === "tool-webSearch" ? (
                  <details
                    key={index}
                    className="rounded-xl border-1 bg-gray-100 p-4 text-gray-500"
                    open={part.state === "output-available"}
                  >
                    <summary className="cursor-pointer font-medium">
                      {part.state !== "output-available"
                        ? "심층 웹 검색 및 요약 중..."
                        : `웹 검색 및 요약 결과(${part.input?.query})`}
                    </summary>
                    <div className="mt-4 text-sm leading-relaxed text-gray-900">
                      {part.output?.summary && (
                        <div className="mb-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-1 text-xs font-bold text-blue-600">
                            <BotIcon className="size-3" /> AI 검색 결과
                            요약{" "}
                          </div>
                          <MyMarkdown>{part.output.summary}</MyMarkdown>
                        </div>
                      )}
                      <div className="mb-2 px-1 text-xs font-semibold text-gray-500">
                        참고 자료
                      </div>
                      <ul className="list-inside list-decimal space-y-1.5 px-1">
                        {part.output?.results?.map((res: any, i: number) => (
                          <li key={i} className="text-gray-700">
                            <a
                              href={res.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {res.title}
                            </a>
                            <p className="mt-0.5 line-clamp-1 text-gray-500">
                              {res.snippet}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ) : part.type === "tool-checkConsistency" ? (
                  <details
                    key={index}
                    className="my-2 rounded-xl border-1 bg-gray-100 p-4 text-gray-500"
                    open={part.state === "output-available"}
                  >
                    <summary className="cursor-pointer font-medium hover:text-gray-700 transition-colors">
                      {part.state !== "output-available" ? (
                        <span className="flex items-center gap-2">
                          <RefreshCwIcon className="size-3 animate-spin" />
                          내부 데이터베이스 확인 중...
                        </span>
                      ) : (
                        "내부 데이터베이스 확인 완료"
                      )}
                    </summary>
                    <div className="mt-4 flex flex-col gap-3 text-sm">
                      <div className="flex items-center gap-2 font-semibold text-orange-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-orange-100 text-[10px] text-orange-700">
                          DB
                        </span>
                        <span>내부 검색 결과: {part.input?.word}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500 italic">
                        {part.output?.message}
                      </div>

                      {part.output?.results && Array.isArray(part.output.results) && part.output.results.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {part.output.results.map((res: any, i: number) => (
                            <div
                              key={i}
                              className="group relative flex flex-col rounded-lg border border-orange-100 bg-white p-2 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-bold text-gray-900">
                                  {res.term}
                                </span>
                                <span className="text-[10px] font-medium text-orange-500">
                                  {Math.round(res.score * 100)}% Match
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-orange-600 font-semibold">
                                {res.translation}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        part.state === "output-available" && (
                          <div className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs italic text-gray-400">
                            매칭되는 내부 데이터가 없습니다.
                          </div>
                        )
                      )}
                    </div>
                  </details>
                ) : null,
              )}
            </div>
          </div>
        ))}
        <div ref={divRef} />
        {status === "submitted" && <div>챗봇이 답을 하는 중입니다...</div>}
        {status === "error" && <div>답변중 오류가 발생했습니다</div>}
      </div>
      <form className="mt-auto" onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
          />
          <InputGroupAddon align="block-end">
            <div className="ml-auto" />
            {status === "ready" && (
              <InputGroupButton type="submit" size="sm" disabled={input === ""}>
                <CornerDownLeftIcon />
              </InputGroupButton>
            )}
            {(status === "streaming" || status === "submitted") && (
              <InputGroupButton type="button" onClick={() => stop()} size="sm">
                <SquareIcon />
              </InputGroupButton>
            )}
            {messages.length > 0 && (
              <InputGroupButton
                type="button"
                onClick={() => regenerate()}
                size="sm"
                disabled={!(status === "ready" || status === "error")}
              >
                <RefreshCwIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}

function MyMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        table({ children }) {
          return (
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="min-w-max">{children}</table>
            </div>
          );
        },
      }}
    >
      {children}
    </Markdown>
  );
}
