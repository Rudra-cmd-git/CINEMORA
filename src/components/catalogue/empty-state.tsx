import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Actions rendered below the copy. */
  children?: ReactNode;
  className?: string;
}

/** Coherent empty state used across the catalogue routes. */
export function EmptyState({ icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-line bg-elevated/30 px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full border border-line bg-surface text-gold"
        >
          {icon}
        </span>
      ) : null}
      <h2 className="mt-5 font-display text-xl leading-snug text-ink sm:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {children ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}
