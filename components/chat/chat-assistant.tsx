"use client";

import { BotIcon, CornerDownLeftIcon, UserIcon } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { ChatMessage } from "@/app/api/chat/route";

export default function ChatAssistant() {
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInput("");
    await sendMessage({
      parts: [{ type: "text", text: input }],
    });
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full max-h-[60vh] flex-col gap-4">
      <div className="overflow-y-auto pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex items-start whitespace-pre-wrap"
          >
            <div className="flex-0">
              {message.role === "user" ? (
                <UserIcon className="mr-1.5 inline-block size-3.5" />
              ) : (
                <BotIcon className="mr-1.5 inline-block size-3.5" />
              )}
            </div>
            <div className="prose max-w-none min-w-0 flex-1">
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return <MyMarkdown key={index}>{part.text}</MyMarkdown>;
                  case "tool-findRelatedWords":
                    return (
                      <div
                        key={index}
                        className="mt-2 rounded-md bg-gray-100 p-2"
                      >
                        <strong>
                          관련 단어 검색:
                          {part.output?.relatedWords
                            ?.map(
                              ({ word, translation }) =>
                                `${word} (${translation})`,
                            )
                            .join(", ")}
                        </strong>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="mt-auto" onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="메시지를 입력하세요..."
            ref={inputRef}
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              type="submit"
              disabled={status !== "ready" || input.trim() === ""}
              size="icon-sm"
              className="ml-auto"
              variant="default"
            >
              <CornerDownLeftIcon className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}

const plugins = [remarkGfm];
const components = {
  table({ children }: { children?: React.ReactNode }) {
    return (
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="min-w-max">{children}</table>
      </div>
    );
  },
};
const MyMarkdown = memo(({ children }: { children: string }) => {
  return (
    <Markdown remarkPlugins={plugins} components={components}>
      {children}
    </Markdown>
  );
});
