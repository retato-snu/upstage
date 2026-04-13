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
