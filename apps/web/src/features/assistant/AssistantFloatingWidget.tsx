import { useEffect, useId, useState } from "react";
import { Bot, History, Plus, Sparkles, X, ArrowLeft } from "lucide-react";
import {
  useConversationMessages,
  useConversations,
  useDeleteConversation,
  useRenameConversation,
  useSendMessage,
} from "@/features/assistant/assistant.hooks";
import {
  ASSISTANT_OPEN_EVENT,
  type AssistantOpenDetail,
} from "@/features/assistant/assistant-events";
import ChatWindow from "@/features/assistant/ChatWindow";
import ConversationList from "@/features/assistant/ConversationList";
import { useAuth } from "@/features/auth/hooks/auth.context";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export function AssistantFloatingWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [lastSentText, setLastSentText] = useState<string>("");
  const panelId = useId();

  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useConversationMessages(activeConversationId);

  const renameConvMutation = useRenameConversation();
  const deleteConvMutation = useDeleteConversation();
  const sendMessageMutation = useSendMessage();

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  const handleSendMessage = (messageText: string) => {
    setLastSentText(messageText);
    setShowHistory(false);
    sendMessageMutation.mutate(
      {
        message: messageText,
        conversationId: activeConversationId,
      },
      {
        onSuccess: (data) => {
          if (data?.conversation?._id && !activeConversationId) {
            setActiveConversationId(data.conversation._id);
          }
        },
      },
    );
  };

  // Listen for global open-assistant events (from DashboardAICard, QuickActions, CommandPalette)
  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AssistantOpenDetail>;
      setIsOpen(true);
      setShowHistory(false);
      const initialPrompt = customEvent.detail?.prompt?.trim();
      if (initialPrompt) {
        setLastSentText(initialPrompt);
        sendMessageMutation.mutate(
          {
            message: initialPrompt,
            conversationId: activeConversationId,
          },
          {
            onSuccess: (data) => {
              if (data?.conversation?._id && !activeConversationId) {
                setActiveConversationId(data.conversation._id);
              }
            },
          },
        );
      }
    };

    window.addEventListener(ASSISTANT_OPEN_EVENT, handleOpenEvent);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, handleOpenEvent);
  }, [activeConversationId, sendMessageMutation]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowHistory(false);
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setShowHistory(false);
  };

  const handleRenameConversation = (id: string, title: string) => {
    renameConvMutation.mutate({ id, title });
  };

  const handleDeleteConversation = (id: string) => {
    deleteConvMutation.mutate(id, {
      onSuccess: () => {
        if (activeConversationId === id) {
          setActiveConversationId(undefined);
        }
      },
    });
  };

  const handleRetry = () => {
    if (lastSentText) {
      handleSendMessage(lastSentText);
    }
  };

  const userName = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <>
      {/* Mobile-Screen-Sized Floating Chat Panel (Right Side) */}
      {isOpen && (
        <section
          id={panelId}
          role="dialog"
          aria-label="Taskloom AI Assistant"
          className={cn(
            "fixed bottom-22 right-4 sm:right-5 z-50 flex flex-col overflow-hidden",
            "w-[calc(100vw-2rem)] sm:w-[400px] h-[min(78dvh,640px)]",
            "rounded-3xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 dark:shadow-black/50",
            "origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200",
          )}
        >
          {/* Widget Top Header */}
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-card/80 px-3.5 py-2.5 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2.5">
              {showHistory ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(false)}
                  aria-label="Back to chat"
                  className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Bot className="size-4" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-xs font-bold tracking-tight text-foreground">
                    {showHistory ? "Chat History" : activeConv?.title ?? "Taskloom AI"}
                  </h2>
                  {!showHistory && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary ring-1 ring-primary/15">
                      <Sparkles className="size-2.5" />
                      AI
                    </span>
                  )}
                </div>
                <p className="truncate text-[10px] text-muted-foreground">
                  {showHistory ? `${conversations.length} conversations` : "Ask about tasks & plans"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={showHistory ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setShowHistory((prev) => !prev)}
                    aria-label={showHistory ? "Close history" : "Conversation history"}
                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    <History className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{showHistory ? "Back to chat" : "Chat history"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNewConversation}
                    aria-label="New conversation"
                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">New chat</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close AI Assistant"
                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Close (Esc)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Widget Body: Either History List or Active Chat */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {showHistory ? (
              <div className="h-full p-3">
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={handleSelectConversation}
                  onNew={handleNewConversation}
                  onRename={handleRenameConversation}
                  onDelete={handleDeleteConversation}
                />
              </div>
            ) : (
              <ChatWindow
                messages={messages}
                title={activeConv?.title ?? "Taskloom AI"}
                userName={userName}
                isSending={sendMessageMutation.isPending}
                error={sendMessageMutation.error}
                onSendMessage={handleSendMessage}
                onRetry={handleRetry}
                onClearChat={activeConversationId ? handleNewConversation : undefined}
                compact
                hideHeader
              />
            )}
          </div>
        </section>
      )}

      {/* Floating Robot AI Launcher Button (Bottom-Right Corner) */}
      <div className="fixed bottom-5 right-4 sm:right-5 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
              className={cn(
                "group relative size-13 sm:size-14 rounded-full shadow-lg shadow-primary/25 ring-2 ring-background transition-all duration-200 hover:scale-105 active:scale-95",
                isOpen
                  ? "bg-card text-foreground border border-border hover:bg-accent"
                  : "bg-primary text-primary-foreground hover:bg-primary/95",
              )}
            >
              {isOpen ? (
                <X className="size-5 transition-transform duration-200" />
              ) : (
                <>
                  <Bot className="size-6 transition-transform duration-200 group-hover:scale-110" />
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 flex size-3.5"
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs font-medium">{isOpen ? "Close AI Assistant" : "AI Assistant"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}

export default AssistantFloatingWidget;
