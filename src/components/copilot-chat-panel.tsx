import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { MicrosoftCopilotStudioService } from "@/generated";
import { cn } from "@/lib/utils";

const AGENT_SCHEMA_NAME = "cr7d7_agent";
const NOTIFICATION_URL = "https://notificationurlplaceholder";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
}

interface CopilotResponseBody {
  lastResponse?: string;
  responses?: string[];
  conversationId?: string;
  message?: string;
}

function extractMessage(data: unknown): string {
  const body = data as CopilotResponseBody | undefined;
  if (!body) return "";
  if (body.lastResponse) return body.lastResponse;
  if (body.responses && body.responses.length > 0) {
    return body.responses.join("\n\n");
  }
  if (body.message) return body.message;
  return "";
}

function extractConversationId(data: unknown): string | undefined {
  const body = data as CopilotResponseBody | undefined;
  return body?.conversationId;
}

export function CopilotChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const result = await MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2(
        AGENT_SCHEMA_NAME,
        {
          notificationUrl: NOTIFICATION_URL,
          message: text,
        },
        conversationIdRef.current
      );

      if (!result.success) {
        throw result.error ?? new Error("Agent request failed");
      }

      const responseText = extractMessage(result.data) || "(no response)";
      const nextConversationId = extractConversationId(result.data);
      if (nextConversationId) {
        conversationIdRef.current = nextConversationId;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "agent",
          text: responseText,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "agent",
          text: `Error: ${message}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleReset() {
    setMessages([]);
    conversationIdRef.current = undefined;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
          "bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-white"
        )}
        title="Open Connected Agent"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 flex w-96 flex-col overflow-hidden rounded-2xl border border-border shadow-2xl",
            "bg-background/95 backdrop-blur-xl"
          )}
          style={{ height: "560px" }}
        >
          <div
            className={cn(
              "flex items-center justify-between border-b border-border px-4 py-3",
              "bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Connected Agent</div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  GCC &middot; Entra ID authenticated
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted"
                  title="Start new conversation"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !isSending && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#EC4899]/20">
                  <Sparkles className="h-6 w-6 text-[#8B5CF6]" />
                </div>
                <div className="text-sm font-medium">Ask me anything</div>
                <div className="max-w-[260px] text-xs text-muted-foreground">
                  This agent inherits your Microsoft sign-in from the Power Apps host. No token handling in the app.
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs",
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background/60 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isSending}
                className={cn(
                  "flex-1 rounded-full border border-border bg-background px-3 py-2 text-xs outline-none",
                  "focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                )}
              />
              <button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity",
                  "bg-gradient-to-br from-[#8B5CF6] to-[#EC4899]",
                  "disabled:opacity-40"
                )}
                title="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
