import Link from "next/link";
import { NotFoundContent } from "@/components/common/not-found-content";
import { SITE } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="cm-shell flex h-[var(--cm-header)] items-center">
        <Link href="/" className="cm-wordmark text-[15px] text-ink">
          {SITE.wordmark}
        </Link>
      </header>
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
    </div>
  );
}
