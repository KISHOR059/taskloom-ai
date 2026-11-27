import { useState, type KeyboardEvent } from "react";
import { MessageSquare, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { Conversation } from "./assistant.types";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

export interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Button
        onClick={onNew}
        variant="default"
        size="sm"
        className="w-full justify-start gap-2 rounded-xl bg-primary/95 text-primary-foreground hover:bg-primary text-xs font-medium shadow-xs transition-all duration-150 active:scale-[0.99]"
      >
        <Plus className="size-3.5" />
        <span>New Conversation</span>
      </Button>

      <div className="assistant-scroller flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Recent Chats
          </span>
          {conversations.length > 0 && (
            <span className="rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
              {conversations.length}
            </span>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-8 text-center">
            <MessageSquare className="size-5 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground/80">No conversations yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeId;
            const isEditing = conv._id === editingId;

            return (
              <div
                key={conv._id}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all duration-150",
                  isActive
                    ? "bg-accent text-foreground font-medium shadow-2xs ring-1 ring-border/70"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-primary"
                  />
                )}

                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(conv._id)}
                    onKeyDown={(e) => handleEditKeyDown(e, conv._id)}
                    aria-label="Rename conversation"
                    autoFocus
                    className="h-6 text-xs py-0 px-1.5 rounded-md"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(conv._id)}
                    aria-current={isActive ? "page" : undefined}
                    className="flex flex-1 items-center gap-2.5 truncate text-left pl-0.5"
                  >
                    <MessageSquare
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{conv.title}</span>
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Conversation actions"
                      className={cn(
                        "size-6 shrink-0 transition-opacity text-muted-foreground hover:text-foreground rounded-md",
                        isActive ? "opacity-70 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                      )}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 text-xs">
                    <DropdownMenuItem onClick={() => handleStartEdit(conv)} className="gap-2">
                      <Pencil className="size-3.5 text-muted-foreground" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(conv._id)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
