"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[cinemora] render error", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center">
      <div className="cm-shell py-24">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Projection interrupted</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Something went wrong in the booth.
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          The page could not be rendered. Try again — if it keeps happening, the catalogue may be
          mid-rebuild.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[11.5px] text-ink-muted cm-tabular">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset} variant="primary">
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </Button>
          <Link href="/" className={buttonClasses("secondary", "md")}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
