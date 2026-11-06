import type { Metadata } from "next";
import { MyListExperience } from "@/components/catalogue/my-list-experience";
import { PageIntro } from "@/components/catalogue/page-intro";
import { movies } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "My List",
  description:
    "Films you have saved for later on Cinemora. Your list is stored in this browser only — no account required.",
  robots: { index: false, follow: false },
};

export default function MyListPage() {
  return (
    <div className="pt-[var(--cm-header)]">
      <PageIntro
        eyebrow="Your library"
        title="My List"
        description="The films you have saved for later. Kept in this browser, synced to nothing, visible to no one."
      />
      <div className="cm-shell py-10 sm:py-12">
        <MyListExperience movies={movies} />
      </div>
    </div>
  );
}
