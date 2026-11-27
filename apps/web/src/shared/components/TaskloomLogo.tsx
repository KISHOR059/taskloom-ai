import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { env } from "@/shared/config/env";

export interface TaskloomLogoProps {
  /** Whether to show the text wordmark alongside the symbol */
  showWordmark?: boolean;
  /** Size variant for symbol and text */
  size?: "sm" | "md" | "lg";
  /** Shorthand to hide wordmark */
  iconOnly?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the SVG icon */
  iconClassName?: string;
  /** Custom class name for the wordmark */
  textClassName?: string;
  /** Whether to render as an interactive Link to /dashboard */
  linkToHome?: boolean;
}

/**
 * Modern geometric brand symbol for Taskloom:
 * Represents interwoven tasks, structured daily rhythm, and AI clarity.
 */
export function TaskloomSymbol({
  className,
  size = 26,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      {/* Rounded ambient background squircle */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        className="fill-primary"
      />

      {/* Top horizontal loom beam (forms the T crown) */}
      <rect
        x="7.5"
        y="8"
        width="17"
        height="3.5"
        rx="1.75"
        className="fill-primary-foreground"
      />

      {/* Center vertical warp pillar */}
      <rect
        x="14.25"
        y="10"
        width="3.5"
        height="14.5"
        rx="1.75"
        className="fill-primary-foreground"
      />

      {/* Interwoven horizontal weft threads */}
      <rect
        x="8.5"
        y="14.5"
        width="4.2"
        height="3.2"
        rx="1.6"
        className="fill-primary-foreground opacity-75"
      />
      <rect
        x="19.3"
        y="14.5"
        width="4.2"
        height="3.2"
        rx="1.6"
        className="fill-primary-foreground opacity-75"
      />

      {/* Subtle AI spark node */}
      <circle
        cx="22"
        cy="21.5"
        r="1.75"
        className="fill-primary-foreground opacity-90"
      />
    </svg>
  );
}

export function TaskloomLogo({
  showWordmark = true,
  size = "md",
  iconOnly = false,
  className,
  iconClassName,
  textClassName,
  linkToHome = true,
}: TaskloomLogoProps) {
  const shouldShowText = showWordmark && !iconOnly;

  const sizeConfig = {
    sm: { iconSize: 22, textClass: "text-sm font-semibold tracking-tight" },
    md: { iconSize: 26, textClass: "text-base font-bold tracking-tight" },
    lg: { iconSize: 32, textClass: "text-lg font-bold tracking-tight" },
  }[size];

  const content = (
    <div
      className={cn(
        "group flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-90 active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <TaskloomSymbol size={sizeConfig.iconSize} className={iconClassName} />
      </div>

      {shouldShowText && (
        <span
          className={cn(
            "bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-foreground font-heading select-none",
            sizeConfig.textClass,
            textClassName,
          )}
        >
          {env.appName || "Taskloom"}
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        to="/dashboard"
        aria-label={`${env.appName || "Taskloom"} home`}
        className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default TaskloomLogo;
