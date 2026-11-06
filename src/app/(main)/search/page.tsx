import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/catalogue/page-intro";
import { SearchExperience } from "@/components/search/search-experience";
import { Skeleton } from "@/components/ui/skeleton";
import { getSearchIndex } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the Cinemora catalogue by title, director, cast, year or genre. Every film is in the public domain and free to watch.",
  alternates: { canonical: "/search" },
};

function SearchFallback() {
  return (
    <div className="cm-shell pb-24 pt-10 sm:pt-12" aria-busy="true" aria-label="Loading search">
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-4 border-b border-line pb-4 sm:gap-6">
            <Skeleton className="aspect-[2/3] w-[64px] shrink-0 rounded-sm sm:w-[78px]" />
            <div className="flex-1 space-y-3 py-1">
              <Skeleton className="h-4 w-1/3 rounded-xs" />
              <Skeleton className="h-3 w-2/5 rounded-xs" />
              <Skeleton className="h-3 w-4/5 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const entries = getSearchIndex();

  return (
    <div className="pt-[var(--cm-header)]">
      <PageIntro
        eyebrow="Search the collection"
        title="Find a film"
        description="Search by title, director, cast member, year or genre. Results update as you type — the address bar keeps the query so you can share it."
      />
      <Suspense fallback={<SearchFallback />}>
        <SearchExperience entries={entries} />
      </Suspense>
    </div>
  );
}
