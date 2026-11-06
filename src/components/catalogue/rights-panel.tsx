import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TERRITORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AssetRights, AssetType, Movie, VerificationStatus } from "@/types";

const ASSET_LABEL: Record<AssetType, string> = {
  video: "Video",
  poster: "Poster",
  backdrop: "Backdrop",
  subtitle: "Subtitle track",
};

const STATUS_TONE: Record<VerificationStatus, "teal" | "gold" | "crimson"> = {
  verified: "teal",
  pending: "gold",
  rejected: "crimson",
};

function territoryNames(codes: string[]): string {
  if (codes.length === 0) return "Not recorded";
  return codes
    .map((code) => TERRITORIES.find((territory) => territory.code === code)?.name ?? code)
    .join(", ");
}

function AssetRow({ asset }: { asset: AssetRights }) {
  return (
    <li className="rounded-md border border-line/80 bg-canvas/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-medium text-ink">{ASSET_LABEL[asset.assetType]}</span>
        <Badge tone={STATUS_TONE[asset.status]}>{asset.status}</Badge>
        {asset.verifiedAt ? (
          <span className="cm-tabular text-[11px] text-ink-muted">verified {asset.verifiedAt}</span>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-x-8 gap-y-2.5 text-[12.5px] sm:grid-cols-2">
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">Licence</dt>
          <dd className="mt-1 leading-relaxed text-ink-soft">
            {asset.licenseUrl ? (
              <ExternalRef href={asset.licenseUrl} label={asset.license} />
            ) : (
              asset.license
            )}
          </dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">Source</dt>
          <dd className="mt-1 leading-relaxed text-ink-soft">
            <ExternalRef href={asset.sourceUrl} label={asset.source} />
          </dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">
            Verified territories
          </dt>
          <dd className={cn("mt-1 leading-relaxed", asset.verifiedTerritories.length > 0 ? "text-ink-soft" : "text-ink-muted")}>
            {territoryNames(asset.verifiedTerritories)}
          </dd>
        </div>

        {asset.verificationNotes ? (
          <div>
            <dt className="text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">Note</dt>
            <dd className="mt-1 leading-relaxed text-ink-muted">{asset.verificationNotes}</dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}

function ExternalRef({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-gold"
    >
      {label}
      <ExternalLink className="size-3 shrink-0" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Collapsible per-asset rights record for one film. */
export function MovieRightsPanel({ movie }: { movie: Movie }) {
  const assets = movie.rights.assetRights;

  return (
    <section
      aria-labelledby="rights-heading"
      className="cm-shell scroll-mt-[calc(var(--cm-header)_+_2rem)] border-t border-line py-14 sm:py-16"
    >
      <details className="group overflow-hidden rounded-lg border border-line bg-elevated/40">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold sm:p-7 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-2.5">
              <span
                role="heading"
                aria-level={2}
                id="rights-heading"
                className="font-display text-xl text-ink sm:text-2xl"
              >
                Rights &amp; sources
              </span>
              <Badge tone={STATUS_TONE[movie.rights.overallStatus]}>
                {movie.rights.overallStatus}
              </Badge>
            </span>
            <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink-muted">
              {assets.length} asset {assets.length === 1 ? "record" : "records"} · licences,
              sources and verified territories
            </span>
          </div>
          <ChevronDown
            aria-hidden
            className="mt-1 size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <div className="border-t border-line px-5 py-6 sm:px-7">
          <p className="max-w-3xl text-[13px] leading-relaxed text-ink-soft">
            Every asset we serve carries its own licence and verification record. Playback is
            allowed only when the video (and, where used, one subtitle track) is verified for
            your selected region. This is an editorial verification, not legal advice — read{" "}
            <Link
              href="/about#rights"
              className="text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-hover"
            >
              how our rights model works
            </Link>
            .
          </p>

          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {assets.map((asset) => (
              <AssetRow key={asset.assetType} asset={asset} />
            ))}
          </ul>

          <div className="mt-6 border-t border-line/80 pt-5">
            <p className="text-[12px] leading-relaxed text-ink-muted">
              Canonical archive record:{" "}
              <ExternalRef href={movie.sourcePage} label={movie.sourcePage} />
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}
