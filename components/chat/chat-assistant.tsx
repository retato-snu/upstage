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
      experimental_throttle: 50,
    });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTop = useRef(0);
  const autoScroll = useRef(true);

  useEffect(() => {
    if (autoScroll.current) {
      divRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input;
    setInput("");
    autoScroll.current = true;
    await sendMessage({
      text: currentInput,
    });
    inputRef.current?.focus();
  };

  const handleRetry = async () => {
    autoScroll.current = true;
    await regenerate();
  };

  const handleStop = async () => {
    await stop();
    autoScroll.current = false;
  };

  return (
    <div className="flex h-full max-h-[60vh] flex-col gap-4">
      <div
        className="overflow-y-auto pr-2"
        onScroll={(e) => {
          if (e.currentTarget.scrollTop < lastScrollTop.current) {
            autoScroll.current = false;
          } else if (
            e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
            e.currentTarget.clientHeight
          ) {
            autoScroll.current = true;
          }
          lastScrollTop.current = e.currentTarget.scrollTop;
        }}
      >
        {messages.map((message) => (
          <div key={message.id} className="flex mb-4">
            <div className="flex-0">
              {message.role === "user" ? (
                <UserIcon className="mr-2 inline-block size-3.5" />
              ) : (
                <BotIcon className="mr-2 inline-block size-3.5" />
              )}
            </div>
            <div className="prose max-w-none min-w-0 flex-1">
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return <MyMarkdown key={index}>{part.text}</MyMarkdown>;
                  case "reasoning":
                    return (
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
                    );
                  case "tool-findRelatedWords":
                    return (
                      <div
                        key={index}
                        className="mt-2 rounded-md bg-gray-100 p-3 text-sm border border-gray-200"
                      >
                        {part.state !== "output-available" ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <RefreshCcwIcon className="size-3 animate-spin" />
                            <span>연관 단어 찾는 중...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-700">
                              🔎 연관 단어 검색 결과 ({part.input?.word}):
                            </span>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {part.output?.map((item: any, i: number) => (
                                <li key={i} className="text-gray-800">
                                  <span className="font-medium text-blue-600">
                                    {item.word}
                                  </span>
                                  : {item.translations.join(", ")}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  case "tool-lookupDefinition":
                    return (
                      <div
                        key={index}
                        className="mt-2 rounded-md bg-blue-50 p-3 text-sm border border-blue-100"
                      >
                        {part.state !== "output-available" ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <span className="animate-bounce">🔎</span>
                            <span>웹에서 정의를 검색하고 있습니다...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-blue-700 flex items-center gap-1">
                              <span>✅ 검색 완료:</span>
                              <span className="text-gray-900">
                                {part.input?.word}
                              </span>
                            </div>
                            <div className="text-gray-700 leading-relaxed italic">
                              "{part.output?.definition}"
                            </div>
                            {part.output?.link && (
                              <a
                                href={part.output.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-1 self-start"
                              >
                                출처: {new URL(part.output.link).hostname}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  default:
                    return null;
                }
              })}
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
                onClick={handleRetry}
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
                onClick={handleStop}
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
