import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Mail } from "lucide-react";
import { RightsTable } from "@/components/catalogue/rights-table";
import { buttonClasses } from "@/components/ui/button-styles";
import {
  catalogueGeneratedAt,
  movies,
  totalRuntimeMinutes,
} from "@/lib/catalogue";
import { SITE, TERRITORIES } from "@/lib/constants";
import { canPlay, catalogueTerritories } from "@/lib/rights";
import { formatRuntime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About & rights",
  description:
    "How Cinemora curates, restores and verifies public-domain cinema — how streaming works, how our per-asset rights model is derived, and the full attribution record for every film in the catalogue.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    title: "Curated, not scraped",
    body: "Editorial shelves, hand-written synopses and a deliberately small collection — chosen for what each film contributed to cinema, not for what an algorithm thinks you will click.",
  },
  {
    title: "Verified, not assumed",
    body: "Every video, poster, backdrop and subtitle carries its own licence, source, evidence link and territory list. Availability is computed from those records, never stored as a guess.",
  },
  {
    title: "No ads. No accounts. No tracking.",
    body: "Your list and your position live in this browser. There is no sign-up wall, no advertising exchange and no analytics script counting the minutes you watch.",
  },
] as const;

const STREAMING_STEPS = [
  {
    title: "A direct file, not a ladder",
    body: "Each film is a single MP4 hosted by the Internet Archive and played by your browser directly. There is no transcoding layer, no adaptive bitrate manifest, no advertising stitch-in and no DRM.",
  },
  {
    title: "HTTP ranges do the seeking",
    body: "The player requests byte ranges from the archive. The archive answers with 206 Partial Content, so jumping to a scene only downloads the bytes around that scene instead of the whole film.",
  },
  {
    title: "Resume is a local note",
    body: "Your position is kept in this browser and sent back to the archive as a range request when you return. Nothing about your viewing is reported to us, because there is no server to report to.",
  },
] as const;

const RIGHTS_MODEL = [
  {
    title: "Public domain is national, not global",
    body: "A film can be free to screen in the United States and still protected elsewhere. Terms differ by country and by the date a work was published, so a single global “public domain” badge would be dishonest.",
  },
  {
    title: "Verified per asset, per territory",
    body: "A film is not one rights record — it is a video file, artwork and often a subtitle track, each with its own source, licence and evidence. We record which territories each asset has been verified for.",
  },
  {
    title: "Derived at playback, never stored",
    body: "When you open a film, the page asks whether the video is verified for your region and, where subtitles are used, whether one subtitle track is too. If the answer is no, the play button becomes a plain explanation.",
  },
] as const;

const REQUEST_EXAMPLE = `GET /download/Nosferatu1922HD/Nosferatu%20(1922)%20HD.mp4
Range: bytes=1048576-

206 Partial Content
Content-Type: video/mp4
Accept-Ranges: bytes`;

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      <h2
        id={id}
        className="mt-3 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.12] text-ink"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[15px] leading-[1.8] text-ink-soft">{description}</p>
      ) : null}
    </div>
  );
}

function territoryName(code: string): string {
  return TERRITORIES.find((territory) => territory.code === code)?.name ?? code;
}

export default function AboutPage() {
  const assetCount = movies.reduce(
    (total, movie) => total + movie.rights.assetRights.length,
    0,
  );
  const territories = catalogueTerritories(movies);
  const years = movies.map((movie) => movie.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const runtime = formatRuntime(totalRuntimeMinutes(movies));
  const generatedDate = new Date(catalogueGeneratedAt).toISOString().slice(0, 10);

  const playableByTerritory = territories.map((code) => ({
    code,
    name: territoryName(code),
    count: movies.filter((movie) => canPlay(movie, code)).length,
  }));

  const stats = [
    { label: "Films", value: String(movies.length) },
    { label: "Total runtime", value: runtime },
    { label: "Asset records", value: String(assetCount) },
    { label: "Verified territories", value: territories.join(" · ") || "—" },
  ];

  return (
    <div className="pt-[var(--cm-header)]">
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="cm-shell pt-14 sm:pt-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
          About Cinemora
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.2rem,5.4vw,4rem)] font-medium leading-[1.02] text-ink">
          Cinema belongs to everyone.
        </h1>
        <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-ink-soft">
          Cinemora is a small, advert-free streaming home for films that have entered the
          public domain. We restore the artwork, verify the rights, and then get out of the
          way so the film can do the talking.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:mt-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-canvas px-5 py-6 sm:px-6">
              <dt className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">
                {stat.label}
              </dt>
              <dd className="cm-tabular mt-2 font-display text-2xl leading-none text-ink sm:text-[28px]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Mission                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="mission-heading"
        className="cm-shell mt-20 sm:mt-28"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              The idea
            </p>
            <h2
              id="mission-heading"
              className="mt-3 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.12] text-ink"
            >
              A serious home for films that belong to the public.
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-[1.85] text-ink-soft">
            <p>
              The public domain is one of cinema’s most generous inventions. Once a film’s
              rights expire it becomes part of a shared inheritance — free to screen, study,
              remix and preserve. In practice those films are scattered across archive pages
              with broken players, auto-playing adverts and no reliable record of what is
              actually free, and where.
            </p>
            <p>
              Cinemora is our answer to that. Every title is hand-picked, every source is
              checked, and every page tells you where the print came from and which
              territories it has been cleared for. There is no subscription, no account and
              nothing in the middle between you and the film.
            </p>
            <p>
              We treat these films the way a repertory cinema would: carefully selected,
              cleanly presented, in the best surviving version we can find — with the
              projectionist visible in the credits.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Principles                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="principles-heading" className="cm-shell mt-14 sm:mt-20">
        <h2 id="principles-heading" className="sr-only">
          What we hold ourselves to
        </h2>
        <ul role="list" className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {PRINCIPLES.map((principle, index) => (
            <li
              key={principle.title}
              className="rounded-lg border border-line bg-elevated/30 p-6"
            >
              <span className="cm-tabular text-[11px] tracking-[0.16em] text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg leading-snug text-ink">
                {principle.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.75] text-ink-muted">{principle.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How streaming works                                               */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="streaming"
        aria-labelledby="streaming-heading"
        className="cm-shell mt-20 scroll-mt-[calc(var(--cm-header)_+_2rem)] sm:mt-28"
      >
        <SectionHeading
          id="streaming-heading"
          eyebrow="How streaming works"
          title="One file, fetched in pieces"
          description="Cinemora does not run a streaming CDN. The films are streamed from the Internet Archive, the same public institution that preserves them — the player is simply a well-behaved window onto that."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <ol className="space-y-6">
            {STREAMING_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="cm-tabular grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 text-[11.5px] text-gold"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-lg leading-snug text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-[1.8] text-ink-soft">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-lg border border-line bg-elevated/40 p-5 sm:p-6">
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">
              What a seek looks like
            </p>
            <pre className="cm-scroll mt-3 overflow-x-auto rounded-md border border-line/70 bg-canvas/60 p-4 text-[11.5px] leading-relaxed text-ink-soft">
              <code>{REQUEST_EXAMPLE}</code>
            </pre>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-muted">
              No manifest, no key exchange, no per-segment requests. Subtitles are read through
              a same-origin proxy because the archive does not send the CORS headers browsers
              require for subtitle files. If the archive is slow, the player tells you and
              offers the original record rather than pretending the film is loading.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Rights model                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="rights"
        aria-labelledby="rights-heading"
        className="cm-shell mt-20 scroll-mt-[calc(var(--cm-header)_+_2rem)] sm:mt-28"
      >
        <SectionHeading
          id="rights-heading"
          eyebrow="The rights model"
          title="Public domain is not one global switch."
          description="Public-domain status depends on where you are, when the work was published, and which copy you are looking at. Rather than hide that complexity behind a badge, we record it — asset by asset."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {RIGHTS_MODEL.map((item) => (
            <div key={item.title} className="rounded-lg border border-line bg-elevated/30 p-6">
              <h3 className="font-display text-lg leading-snug text-ink">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.75] text-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-line bg-elevated/30 p-5 sm:p-6">
          <p className="text-[12.5px] leading-relaxed text-ink-soft">
            Right now the derived permissions in this catalogue look like this — computed at
            build time from the records below, for the territories we currently verify:
          </p>
          <ul role="list" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playableByTerritory.map((territory) => (
              <li
                key={territory.code}
                className="flex items-baseline justify-between gap-4 rounded-md border border-line bg-canvas/40 px-3.5 py-2.5"
              >
                <span className="text-[12.5px] text-ink-soft">{territory.name}</span>
                <span className="cm-tabular text-[12px] text-gold">
                  {territory.count} of {movies.length} playable
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-muted">
            A film only plays when its video asset — and, where subtitles are used, at least
            one subtitle track — is verified for the selected territory. This is editorial
            verification, not legal advice. Licences change; if you spot an error, please tell
            us.
          </p>
        </div>

        <div className="mt-14">
          <RightsTable movies={movies} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Region                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="region"
        aria-labelledby="region-heading"
        className="cm-shell mt-20 scroll-mt-[calc(var(--cm-header)_+_2rem)] sm:mt-28"
      >
        <div className="rounded-lg border border-line bg-elevated/30 p-6 sm:p-10">
          <SectionHeading
            id="region-heading"
            eyebrow="Region availability"
            title="A convenience, not a lock."
            description="Cinemora asks your browser which region it thinks you are in so it can show you the films that have been verified for that region. That filter is a usability feature — it is not enforcement, and it is not a claim of legal availability."
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-4 text-[13.5px] leading-[1.8] text-ink-soft">
              <p>
                Detection is a heuristic built from your browser’s language and timezone. It
                happens in your browser, is stored locally, and never reaches a server — we do
                not geolocate by IP address and we do not run a location service.
              </p>
              <p>
                You can override the guess at any time from the region picker in the header or
                the footer. The choice is remembered on this device and applied to the play
                controls on every film page.
              </p>
              <p>
                Changing the region does not unlock anything we have not verified; it only
                changes which verified titles we offer. If your country is not listed, choose{" "}
                <span className="text-ink">“Other / not sure”</span> and check your local
                position before watching.
              </p>
            </div>

            <div>
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">
                Territories in the current catalogue
              </p>
              <ul role="list" className="mt-3 space-y-2">
                {territories.map((code) => (
                  <li
                    key={code}
                    className="flex items-center justify-between gap-4 rounded-md border border-line bg-canvas/40 px-3.5 py-2.5"
                  >
                    <span className="text-[12.5px] text-ink-soft">{territoryName(code)}</span>
                    <span className="cm-tabular text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                      {code}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
                Territory codes are ISO 3166-1 alpha-2. New territories are added when a source
                record is verified for them — not when a viewer asks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Contact                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="contact-heading" className="cm-shell mt-20 sm:mt-28">
        <SectionHeading
          id="contact-heading"
          eyebrow="Contact"
          title="Corrections, takedowns, questions."
          description="If you believe something in the catalogue is not in the public domain in your territory, or that an attribution is wrong, we want to hear it. Reports are reviewed by hand and disputed titles are removed while we investigate."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Cinemora rights correction")}`}
            className="group rounded-lg border border-line bg-elevated/30 p-6 transition-colors hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-gold">
              <Mail className="size-4" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg text-ink">Report a rights issue</h3>
            <p className="mt-1.5 text-[13px] leading-[1.75] text-ink-muted">
              Include the film title and, where you can, a source for the claim. We will
              respond and update the record.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-gold">
              {SITE.contactEmail}
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </a>

          <a
            href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Cinemora playback problem")}`}
            className="group rounded-lg border border-line bg-elevated/30 p-6 transition-colors hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-gold">
              <ExternalLink className="size-4" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg text-ink">Report a broken stream</h3>
            <p className="mt-1.5 text-[13px] leading-[1.75] text-ink-muted">
              Tell us the film, your browser and what happened. Every stream can also be
              opened directly on the archive record linked from the film page.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-gold">
              {SITE.contactEmail}
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/explore" className={buttonClasses("primary", "md")}>
            Browse the collection
          </Link>
          <Link href="/about#rights" className={buttonClasses("secondary", "md")}>
            Read the rights records
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Colophon                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="cm-shell mt-16 border-t border-line py-8">
        <p className="max-w-3xl text-[11.5px] leading-relaxed text-ink-muted">
          Catalogue last generated {generatedDate}. Editorial data — titles, synopses and
          curatorial notes — is written by Cinemora. Film prints, poster artwork and subtitle
          files remain the work of their original creators and are used here only where their
          rights records permit it. Films span {firstYear}–{lastYear} and{" "}
          {movies.length} titles across {assetCount} verified asset records.
        </p>
      </div>
    </div>
  );
}
