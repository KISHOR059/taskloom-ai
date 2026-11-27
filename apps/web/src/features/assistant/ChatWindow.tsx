import { useEffect, useRef, useState } from "react";
import { Bot, Trash2, AlertCircle, RefreshCw, Sparkles, ArrowDown } from "lucide-react";
import type { Message } from "./assistant.types";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import AIThinkingIndicator from "./AIThinkingIndicator";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export interface ChatWindowProps {
  messages: Message[];
  title?: string;
  userName?: string;
  isSending: boolean;
  onSendMessage: (text: string) => Promise<string> | void;
  onClearChat?: () => void;
  error?: Error | null;
  onRetry?: () => void;
  compact?: boolean;
  hideHeader?: boolean;
  className?: string;
}

export function ChatWindow({
  messages,
  title = "AI Assistance",
  userName,
  isSending,
  onSendMessage,
  onClearChat,
  error,
  onRetry,
  compact = false,
  hideHeader = false,
  className,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom smoothly on message change or typing
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, isSending]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceFromBottom > 140);
  };

  const isEmpty = messages.length === 0;
  const firstName = userName?.split(" ")[0];

  return (
    <div
      className={cn(
        "assistant-ambient-bg relative flex h-full min-h-0 flex-col overflow-hidden",
        !compact && "rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md shadow-xs",
        className,
      )}
    >
      {/* Workspace Sub-Header */}
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 bg-background/60 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Sparkles className="size-3.5" />
            </div>
            <h2 className="truncate text-xs font-semibold text-foreground tracking-tight">{title}</h2>
            {!isEmpty && (
              <span className="hidden sm:inline-flex rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {onClearChat && !isEmpty && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearChat}
                    className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-lg px-2.5"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Start a new conversation</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Messages / Conversation Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          "assistant-scroller assistant-scroll-hints flex-1 min-h-0 overflow-y-auto",
          compact ? "px-3 py-3" : "px-4 py-5 sm:px-6",
        )}
      >
        <div className={cn("mx-auto w-full space-y-3", !compact && "max-w-3xl space-y-4")}>
          {/* Empty State */}
          {isEmpty ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center text-center animate-in fade-in duration-300",
                compact ? "py-4 space-y-4" : "min-h-[48vh] py-8 space-y-6",
              )}
            >
              <div className="relative">
                <div className="absolute -inset-2 rounded-3xl bg-primary/10 blur-md" aria-hidden="true" />
                <div
                  className={cn(
                    "relative flex items-center justify-center rounded-2xl bg-card text-primary border border-primary/25 shadow-sm",
                    compact ? "size-11" : "size-14",
                  )}
                >
                  <Bot className={compact ? "size-5" : "size-7"} />
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className={cn("font-bold text-foreground tracking-tight", compact ? "text-base" : "text-lg sm:text-xl")}>
                  {firstName ? `How can I help, ${firstName}?` : "How can I help you today?"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask about your tasks, schedule, priorities, or let me organize your week.
                </p>
              </div>

              <SuggestionChips
                onSelectSuggestion={onSendMessage}
                disabled={isSending}
                compact={compact}
              />
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} userName={userName} />
              ))}

              {isSending && <AIThinkingIndicator />}

              {/* Inline Error State */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error.message || "Failed to generate AI response. Please try again."}</span>
                  </div>
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="h-7 text-[11px] gap-1 border-destructive/30 bg-background/80 hover:bg-destructive/10"
                    >
                      <RefreshCw className="size-3" />
                      Retry
                    </Button>
                  )}
                </div>
              )}

              <div ref={bottomRef} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll-to-Bottom Floating Button */}
      {showScrollBottom && !isEmpty && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => scrollToBottom("smooth")}
            aria-label="Scroll to latest message"
            className="pointer-events-auto h-7 rounded-full border border-border/80 bg-card/90 px-3 text-[11px] font-medium shadow-md backdrop-blur-md hover:bg-accent transition-all animate-in fade-in zoom-in-95 duration-150"
          >
            <ArrowDown className="size-3 mr-1" />
            Latest
          </Button>
        </div>
      )}

      {/* Floating Composer Area */}
      <div
        className={cn(
          "shrink-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent",
          compact ? "p-2.5 pt-1" : "p-3 sm:p-4",
        )}
      >
        <div className={cn("mx-auto w-full", !compact && "max-w-3xl")}>
          <ChatInput
            onSendMessage={onSendMessage}
            disabled={isSending}
            lastAssistantMessage={
              messages.filter((m) => m.role === "assistant").pop()?.content
            }
          />
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
