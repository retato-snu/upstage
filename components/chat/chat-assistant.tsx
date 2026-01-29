"use client";

import { BotIcon, CornerDownLeftIcon, UserIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { ModelMessage } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: input },
    ]);
    setInput("");
    const response = await fetch("/api/chat", {
      method: "POST",
      // headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: input }],
      }),
    });
    const { messages: newMessages } = await response.json();

    setMessages((currentMessages) => [...currentMessages, ...newMessages]);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full max-h-[60vh] flex-col gap-4">
      <div className="overflow-y-auto pr-2">
        {messages.map((message, index) => (
          <div key={index} className="flex items-start whitespace-pre-wrap">
            <div className="flex-0">
              {message.role === "user" ? (
                <UserIcon className="mr-1.5 inline-block size-3.5" />
              ) : (
                <BotIcon className="mr-1.5 inline-block size-3.5" />
              )}
            </div>
            <div className="prose max-w-none min-w-0 flex-1">
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
                {typeof message.content === "string"
                  ? message.content
                  : message.content
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join()}
              </Markdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start whitespace-pre-wrap">
            <div className="flex-0">
              <BotIcon className="mr-1.5 inline-block size-3.5" />
            </div>
            <div className="prose max-w-none min-w-0 flex-1">
              <em>Assistant is typing...</em>
            </div>
          </div>
        )}
      </div>

      <form className="mt-auto" onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="메시지를 입력하세요..."
            ref={inputRef}
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              type="submit"
              disabled={isLoading || input.trim() === ""}
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
