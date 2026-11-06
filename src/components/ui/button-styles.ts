import { cn } from "@/lib/utils";

/**
 * Button styling lives in its own framework-neutral module so that **server
 * components can compose link buttons** without crossing the client boundary.
 * `Button` itself (an interactive client component) lives in `button.tsx`.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-ink-inverse hover:bg-gold-hover active:bg-gold-dim shadow-[0_10px_30px_-12px_rgba(228,180,92,0.7)]",
  secondary:
    "bg-white/[0.08] text-ink hover:bg-white/[0.14] ring-1 ring-inset ring-white/10 backdrop-blur-sm",
  ghost: "text-ink-soft hover:text-ink hover:bg-white/[0.07]",
  outline: "text-ink ring-1 ring-inset ring-line-strong hover:ring-gold/60 hover:text-gold",
  danger: "bg-crimson text-white hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-sm",
  md: "h-11 px-5 text-sm rounded-md",
  lg: "h-13 px-7 text-[15px] rounded-md",
  icon: "h-10 w-10 rounded-full",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium leading-none",
    "transition-[background-color,color,box-shadow,transform,filter] duration-200 ease-[var(--cm-ease)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
