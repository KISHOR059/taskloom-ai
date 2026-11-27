import { Sparkles, Calendar, CheckSquare, Compass, ListOrdered, ArrowUpRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface SuggestionChipsProps {
  onSelectSuggestion: (prompt: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const SUGGESTIONS = [
  {
    icon: Compass,
    category: "Focus",
    label: "What should I focus on today?",
  },
  {
    icon: CheckSquare,
    category: "Tasks",
    label: "Summarize my upcoming tasks",
  },
  {
    icon: Sparkles,
    category: "Planning",
    label: "Help me plan my day",
  },
  {
    icon: Calendar,
    category: "Schedule",
    label: "What meetings do I have this week?",
  },
  {
    icon: ListOrdered,
    category: "Priority",
    label: "Prioritize my open tasks",
  },
];

export function SuggestionChips({
  onSelectSuggestion,
  disabled,
  compact = false,
  className,
}: SuggestionChipsProps) {
  return (
    <div
      className={cn(
        "grid w-full",
        compact ? "grid-cols-1 gap-2" : "grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl",
        className,
      )}
    >
      {SUGGESTIONS.map(({ icon: Icon, category, label }, index) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelectSuggestion(label)}
          className={cn(
            "group relative flex items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-card/80 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/70 hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 shadow-2xs",
            compact ? "px-3 py-2" : "px-3.5 py-3",
            !compact && index === SUGGESTIONS.length - 1 && SUGGESTIONS.length % 2 === 1 && "sm:col-span-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary",
                compact ? "size-7" : "size-8",
              )}
            >
              <Icon className={compact ? "size-3.5" : "size-4"} />
            </div>
            <div className="min-w-0">
              {!compact && (
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {category}
                </span>
              )}
              <span className="block truncate text-xs font-medium text-foreground/95 group-hover:text-foreground">
                {label}
              </span>
            </div>
          </div>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
