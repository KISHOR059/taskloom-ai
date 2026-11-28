import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { TaskloomLogo } from "@/shared/components/TaskloomLogo";
import { cn } from "@/shared/lib/cn";

type AuthCardProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

/**
 * Shared wrapper for all auth screens (register, etc.).
 * Fully theme-aware: white/light in light mode, dark in dark mode.
 */
function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <main className="command-aurora-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-3.5 py-6 sm:px-6 sm:py-10">
      {/* Subtle Command Center micro-grid */}
      <div
        className="command-grid-pattern pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="w-full max-w-[460px]"
      >
        {/* Brand */}
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <TaskloomLogo size="lg" linkToHome={false} />
          <p className="mt-0.5 text-[10px] font-semibold tracking-[0.22em] text-primary/80 uppercase select-none">
            AI Command Workspace
          </p>
        </div>

        {/* High-Contrast Card */}
        <div className={cn(
          "rounded-2xl border border-border/80 border-t-2 border-t-primary bg-card/95 p-5 sm:p-7 backdrop-blur-md shadow-xl shadow-primary/5",
          "dark:shadow-black/40",
        )}>
          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Content */}
          {children}

          {/* Footer */}
          {footer && (
            <div className="mt-6 border-t border-border/50 pt-5 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default AuthCard;
