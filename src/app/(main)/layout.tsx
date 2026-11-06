import { SiteFooter } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/header";
import { getActiveGenres, getSearchIndex } from "@/lib/catalogue";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const searchIndex = getSearchIndex();
  const genres = getActiveGenres();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader searchIndex={searchIndex} genres={genres} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
