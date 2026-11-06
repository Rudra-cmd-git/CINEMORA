import type { Metadata } from "next";
import { ContinueExperience } from "@/components/catalogue/continue-experience";
import { PageIntro } from "@/components/catalogue/page-intro";
import { getSearchIndex } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Continue watching",
  description:
    "Resume the films you have started on Cinemora. Playback position is kept in this browser only.",
  robots: { index: false, follow: false },
};

export default function ContinuePage() {
  const entries = getSearchIndex();

  return (
    <div className="pt-[var(--cm-header)]">
      <PageIntro
        eyebrow="Your library"
        title="Continue watching"
        description="Your position is saved as you watch. Pick a film back up where you left it, or revisit something you have finished."
      />
      <div className="cm-shell py-10 sm:py-12">
        <ContinueExperience entries={entries} />
      </div>
    </div>
  );
}
