import Link from "next/link";
import { LayoutDashboard, Server, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_ROUTES } from "@/lib/constants";

const ADMIN_NAV = [
  { href: ADMIN_ROUTES.root, label: "Dashboard", icon: LayoutDashboard },
  { href: ADMIN_ROUTES.services, label: "Third-Party Services", icon: Server },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="cm-glass border-b border-line sticky top-0 z-[var(--cm-z-sticky)]">
        <div className="cm-shell flex h-16 items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Back to Cinemora"
          >
            <Home className="size-5" aria-hidden />
            <span className="cm-wordmark text-[15px] font-semibold">CINEMORA</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-muted">
              Admin
            </span>
          </Link>

          <nav className="flex-1 flex items-center justify-center gap-1" aria-label="Admin navigation">
            {ADMIN_NAV.map((item) => (
              <AdminNavLink key={item.href} {...item} />
            ))}
          </nav>

          <Link
            href="/"
            className="rounded-sm px-3 py-2 text-[13px] text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            View Site
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1 cm-shell py-8">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}