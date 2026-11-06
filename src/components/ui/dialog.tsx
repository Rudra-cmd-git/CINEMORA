"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const Overlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[var(--cm-z-modal)] bg-black/70 backdrop-blur-sm",
      "data-[state=open]:animate-fade-in",
      className,
    )}
    {...props}
  />
));
Overlay.displayName = "DialogOverlay";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
    bare?: boolean;
  }
>(({ className, children, showClose = true, bare = false, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[var(--cm-z-modal)] w-[min(94vw,36rem)] -translate-x-1/2 -translate-y-1/2",
        "data-[state=open]:animate-scale-in focus:outline-none",
        !bare &&
          "rounded-lg border border-line bg-elevated p-6 shadow-[var(--cm-shadow-xl)] sm:p-7",
        className,
      )}
      {...props}
    >
      {children}
      {showClose ? (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-full p-2 text-ink-muted transition hover:bg-white/[0.07] hover:text-ink focus-visible:ring-2 focus-visible:ring-gold"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

/** Right-hand drawer used for the mobile navigation. */
export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 right-0 z-[var(--cm-z-drawer)] flex w-[min(88vw,22rem)] flex-col",
        "border-l border-line bg-canvas-soft shadow-[var(--cm-shadow-xl)]",
        "data-[state=open]:animate-fade-in focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
