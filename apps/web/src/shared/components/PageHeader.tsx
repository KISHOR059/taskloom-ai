import type { ReactNode } from "react";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  level?: "h1" | "h2";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  level = "h1",
}: PageHeaderProps) {
  const Heading = level;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur-md shadow-2xs sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5 min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <Heading className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </Heading>
        {description && (
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
