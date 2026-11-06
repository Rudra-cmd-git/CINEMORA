import type { ReactNode } from "react";

/**
 * Immersive player shell.
 *
 * Deliberately minimal: no site header, no footer, no promotional chrome —
 * just the film. The root layout still provides fonts, the toast provider and
 * the page background, so the watch route keeps the same typographic system
 * while feeling like a dedicated theatre.
 */
export default function PlayerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <main id="main" className="flex min-h-dvh flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
