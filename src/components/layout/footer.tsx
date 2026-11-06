import Link from "next/link";
import { RegionSelector } from "@/components/layout/region-selector";
import { SITE } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { href: "/explore", label: "All films" },
      { href: "/genres/horror", label: "Horror" },
      { href: "/genres/silent", label: "Silent era" },
      { href: "/genres/noir", label: "Film noir" },
      { href: "/genres/sci-fi", label: "Science fiction" },
    ],
  },
  {
    title: "Your library",
    links: [
      { href: "/my-list", label: "My list" },
      { href: "/continue", label: "Continue watching" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About Cinemora" },
      { href: "/about#rights", label: "Rights & sources" },
      { href: "/about#region", label: "Region availability" },
      { href: `mailto:${SITE.contactEmail}`, label: "Report a problem" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-canvas-soft">
      <div className="cm-shell py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="cm-wordmark text-base text-ink">
              CINEMORA
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              {SITE.description}
            </p>
            <div className="mt-5">
              <RegionSelector />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-14">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-ink-soft transition-colors hover:text-gold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-[11.5px] leading-relaxed text-ink-muted">
            Every film in the Cinemora catalogue is in the public domain. Video is streamed
            directly from the Internet Archive; poster artwork originates from Wikimedia
            Commons and is regenerated locally. No advertising, no tracking, no accounts.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-[11.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Cinemora. Catalogue data is editorial.</p>
            <p>
              <Link href="/about#rights" className="text-ink-soft hover:text-gold">
                Rights &amp; sources
              </Link>
              <span aria-hidden className="px-2">
                ·
              </span>
              <a href={`mailto:${SITE.contactEmail}`} className="text-ink-soft hover:text-gold">
                {SITE.contactEmail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
