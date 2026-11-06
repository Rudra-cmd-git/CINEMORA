import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full rounded-md border border-line bg-surface/70 px-4 text-sm text-ink",
        "placeholder:text-ink-muted transition-colors",
        "focus:border-gold/60 focus:bg-surface focus:outline-none focus:ring-0",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export function FieldLabel({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted", className)}
      {...props}
    >
      {children}
    </label>
  );
}
