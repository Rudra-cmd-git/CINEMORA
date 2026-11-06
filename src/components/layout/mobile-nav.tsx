"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { RegionSelector } from "@/components/layout/region-selector";
import { Dialog, DialogTitle, SheetContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/[0.07] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </DialogTrigger>
      <SheetContent aria-describedby={undefined}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <DialogTitle className="cm-wordmark text-sm text-ink">CINEMORA</DialogTitle>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 cm-scroll" aria-label="Mobile">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-3 text-[15px] text-ink-soft transition-colors",
                    "hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line px-5 py-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-muted">Region</p>
          <RegionSelector />
        </div>
      </SheetContent>
    </Dialog>
  );
}
