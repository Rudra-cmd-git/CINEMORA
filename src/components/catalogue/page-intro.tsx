import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageIntroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Meta line, actions or anything below the description. */
  children?: ReactNode;
  className?: string;
}

/**
 * Shared editorial page header used by the catalogue routes. Server-safe so
 * both server pages and client shells can compose it.
 */
export function PageIntro({ eyebrow, title, description, children, className }: PageIntroProps) {
  return (
    <header className={cn("cm-shell pt-12 sm:pt-16", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      ) : null}
      <h1 className="mt-4 max-w-4xl font-display text-[clamp(2rem,4.8vw,3.4rem)] leading-[1.06] text-ink">
        {title}
      </h1>
      {description ? (
        <p className="mt-5 max-w-2xl text-[15px] leading-[1.8] text-ink-soft">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
