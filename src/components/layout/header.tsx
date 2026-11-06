"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RegionSelector } from "@/components/layout/region-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import type { SearchEntry } from "@/lib/catalogue";
import { cn } from "@/lib/utils";
import type { Genre } from "@/types";

const PRIMARY_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/my-list", label: "My List" },
  { href: "/continue", label: "Continue" },
];

export function SiteHeader({
  searchIndex,
  genres,
}: {
  searchIndex: SearchEntry[];
  genres: Genre[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isPaletteShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isPaletteShortcut) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }

      if (event.key === "/" && !isPaletteShortcut) {
        const target = event.target as HTMLElement | null;
        const typing =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target?.isContentEditable;
        if (!typing) {
          event.preventDefault();
          setPaletteOpen(true);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[var(--cm-z-sticky)] transition-colors duration-300",
          scrolled
            ? "cm-glass border-b border-line"
            : "border-b border-transparent bg-gradient-to-b from-canvas/90 via-canvas/40 to-transparent",
        )}
      >
        <div className="cm-shell flex h-[var(--cm-header)] items-center gap-2 sm:gap-5">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Cinemora home"
          >
            <span
              aria-hidden
              className="grid size-6 place-items-center rounded-full border border-gold/50 text-gold transition-colors group-hover:border-gold"
            >
              <span className="size-1.5 rounded-full bg-gold" />
            </span>
            <span className="cm-wordmark text-[15px] text-ink sm:text-base">CINEMORA</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <NavItem href="/explore" label="Explore" active={isActive("/explore")} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "rounded-sm px-3 py-2 text-[13px] transition-colors",
                    pathname.startsWith("/genres")
                      ? "text-ink"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  Genres
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="columns-1">
                {genres.map((genre) => (
                  <DropdownMenuItem key={genre.slug} asChild>
                    <Link href={`/genres/${genre.slug}`}>{genre.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NavItem href="/my-list" label="My List" active={isActive("/my-list")} />
            <NavItem href="/continue" label="Continue" active={isActive("/continue")} />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className={cn(
                "group hidden h-9 items-center gap-2 rounded-full border border-line px-3 text-[12.5px] text-ink-muted transition-colors sm:flex",
                "hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              )}
              aria-label="Search the catalogue"
            >
              <Search className="size-3.5" aria-hidden />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden rounded-xs border border-line px-1.5 py-0.5 text-[10px] md:inline">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/[0.07] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:hidden"
              aria-label="Search the catalogue"
            >
              <Search className="size-5" />
            </button>

            <RegionSelector className="hidden md:inline-flex" />
            <MobileNav
              links={[
                { href: "/explore", label: "Explore" },
                ...genres.map((genre) => ({
                  href: `/genres/${genre.slug}`,
                  label: genre.name,
                })),
                { href: "/my-list", label: "My List" },
                { href: "/continue", label: "Continue Watching" },
                { href: "/about", label: "About & Rights" },
              ]}
            />
          </div>
        </div>
      </header>

      <CommandPalette entries={searchIndex} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-sm px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        active ? "text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
