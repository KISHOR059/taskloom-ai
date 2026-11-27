import { Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface AIThinkingIndicatorProps {
  className?: string;
  label?: string;
}

export function AIThinkingIndicator({
  className,
  label = "Taskloom is thinking",
}: AIThinkingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Taskloom is thinking and generating a response"
      className={cn(
        "group relative flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/25 px-4 py-3.5 text-left animate-in fade-in duration-200 select-none",
        className,
      )}
    >
      {/* Stable AI Icon with subtle breath */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-2xs">
        <Sparkles className="size-4 text-primary motion-safe:animate-pulse [animation-duration:2.2s] motion-reduce:animate-none" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5 py-0.5">
        {/* Thinking Label & Sequentially Pulsing Minimal Dots */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground/90 tracking-tight">{label}</span>
          <span className="inline-flex items-center gap-1 text-primary" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-primary/75 motion-safe:animate-pulse [animation-duration:1.2s] [animation-delay:0ms] motion-reduce:animate-none" />
            <span className="size-1.5 rounded-full bg-primary/75 motion-safe:animate-pulse [animation-duration:1.2s] [animation-delay:250ms] motion-reduce:animate-none" />
            <span className="size-1.5 rounded-full bg-primary/75 motion-safe:animate-pulse [animation-duration:1.2s] [animation-delay:500ms] motion-reduce:animate-none" />
          </span>
        </div>

        {/* Subtle Multi-line Shimmer */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-3/4 max-w-xs rounded-full bg-muted/70 motion-safe:animate-pulse [animation-duration:2s] motion-reduce:animate-none" />
          <div className="h-2.5 w-1/2 max-w-[12rem] rounded-full bg-muted/50 motion-safe:animate-pulse [animation-duration:2s] [animation-delay:200ms] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

export default AIThinkingIndicator;
