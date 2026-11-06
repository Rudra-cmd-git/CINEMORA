"use client";

import { Check, Info } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type ToastTone = "default" | "success" | "error";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Keep components usable in isolation (tests, storybook-ish previews).
    return { toast: () => undefined };
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ title, description, tone = "default" }) => {
      const id = ++counter.current;
      setItems((current) => [...current.slice(-2), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[var(--cm-z-toast)] flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 shadow-[var(--cm-shadow-lg)]",
              "bg-elevated/95 backdrop-blur-xl animate-fade-up",
              item.tone === "error" ? "border-crimson/40" : "border-line",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                item.tone === "success" && "bg-teal-soft text-teal",
                item.tone === "error" && "bg-crimson-soft text-[#ff8b98]",
                item.tone === "default" && "bg-gold-soft text-gold",
              )}
            >
              {item.tone === "success" ? (
                <Check className="size-3" strokeWidth={3} />
              ) : (
                <Info className="size-3" strokeWidth={3} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="text-ink-muted transition-colors hover:text-ink"
              aria-label="Dismiss notification"
            >
              <span aria-hidden className="text-base leading-none">
                ×
              </span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
