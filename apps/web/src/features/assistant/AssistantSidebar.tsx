import type { Conversation } from "./assistant.types";
import ConversationList from "./ConversationList";
import { cn } from "@/shared/lib/cn";

export interface AssistantSidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function AssistantSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  className,
}: AssistantSidebarProps) {
  return (
    <aside
      aria-label="Conversation history"
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md shadow-xs",
        className,
      )}
    >
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        onNew={onNew}
        onRename={onRename}
        onDelete={onDelete}
      />
    </aside>
  );
}

export default AssistantSidebar;
