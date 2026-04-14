"use client";

import {
  BotIcon,
  CornerDownLeftIcon,
  UserIcon,
  RefreshCcwIcon,
  SquareIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const { messages, sendMessage, regenerate, stop, status } =
    useChat<ChatMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
      experimental_throttle: 100,
    });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "streaming" || status === "submitted") {
      divRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input;
    setInput("");
    await sendMessage({
      text: currentInput,
    });
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full max-h-[60vh] flex-col gap-4">
      <div className="overflow-y-auto pr-2">
        {messages.map((message) => (
          <div key={message.id} className="flex mb-4">
            <div className="flex-0">
              {message.role === "user" ? (
                <UserIcon className="mr-2 inline-block size-3.5" />
              ) : (
                <BotIcon className="mr-2 inline-block size-3.5" />
              )}
            </div>
            <div className="prose min-w-0 flex-1">
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  <MyMarkdown key={index}>{part.text}</MyMarkdown>
                ) : part.type === "reasoning" ? (
                  <details
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-500 my-2"
                  >
                    <summary className="cursor-pointer font-medium">
                      생각하는 중...
                    </summary>
                    <div className="mt-2 text-sm">
                      <MyMarkdown>{part.text}</MyMarkdown>
                    </div>
                  </details>
                ) : part.type === "tool-findRelatedWords" ? (
                  <details
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-500 my-2"
                    open={part.state === "output-available"}
                  >
                    <summary className="cursor-pointer font-medium">연관 단어 찾는 중...</summary>
                    <b>{part.input?.word} 관련 단어</b>
                    <ul>
                      {part.output?.map(
                        ({ word, translations }: any) =>
                          `${word}: ${translations.join(", ")}`,
                      )}
                    </ul>
                  </details>
                ) : part.type === "tool-lookupDefinition" ? (
                  <details
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-500 my-2"
                  >
                    <summary className="cursor-pointer font-medium">웹에서 정의 검색 중...</summary>
                    <b>{part.input?.word} 정의 검색 결과</b>
                    <ul>
                      <li>{part.output?.definition}</li>
                      {part.output?.link && (
                        <li>
                          <a href={part.output.link} target="_blank" rel="noopener noreferrer">
                            출처 확인하기
                          </a>
                        </li>
                      )}
                    </ul>
                  </details>
                ) : part.type === "tool-webSearch" ? (
                  <details
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-500 my-2"
                    open={part.state === "output-available"}
                  >
                    <summary className="cursor-pointer font-medium">
                      {part.state !== "output-available"
                        ? "심층 웹 검색 및 요약 중..."
                        : `웹 검색 및 요약 결과 (질의: ${part.input?.query})`}
                    </summary>
                    <div className="mt-4 text-sm text-gray-900 leading-relaxed">
                      {part.output?.summary && (
                        <div className="mb-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                          <div className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                            <BotIcon className="size-3" />
                            AI 검색 요약
                          </div>
                          <MyMarkdown>{part.output.summary}</MyMarkdown>
                        </div>
                      )}
                      
                      <div className="text-xs font-semibold text-gray-500 mb-2 px-1">참고 자료</div>
                      <ul className="list-decimal list-inside space-y-1.5 px-1">
                        {part.output?.results?.map((res: any, i: number) => (
                          <li key={i} className="text-gray-700">
                            <a 
                              href={res.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {res.title}
                            </a>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {res.snippet}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ) : null
              )}
            </div>
          </div>
        ))}
        <div ref={divRef} />
        {status === "submitted" && (
          <div className="text-sm text-gray-500 animate-pulse">
            챗봇이 답을 하는 중입니다...
          </div>
        )}
        {status === "error" && (
          <div className="text-sm text-red-500">답변 중 오류가 발생했습니다</div>
        )}
      </div>
      <form className="mt-auto" onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupInput
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
          />
          <InputGroupAddon align="block-end" className="justify-end bg-white">
            {messages.length > 0 && (
              <InputGroupButton
                type="button"
                disabled={status === "submitted" || status === "streaming"}
                size="icon-sm"
                variant="ghost"
                onClick={() => regenerate()}
              >
                <RefreshCcwIcon className="size-4" />
              </InputGroupButton>
            )}
            {status === "ready" || status === "error" ? (
              <InputGroupButton
                type="submit"
                disabled={input.trim() === ""}
                size="icon-sm"
                variant="default"
              >
                <CornerDownLeftIcon className="size-4" />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="default"
                onClick={() => stop()}
              >
                <SquareIcon className="size-4" />
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
            <div className="overflow-x-auto overflow-y-hidden my-2">
              <table className="min-w-max border-collapse border border-gray-200">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border border-gray-200 bg-gray-50 px-3 py-1 text-left">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="border border-gray-200 px-3 py-1">{children}</td>
          );
        },
      }}
    >
      {children}
    </Markdown>
  );
}
