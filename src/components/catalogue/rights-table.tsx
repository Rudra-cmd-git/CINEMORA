import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TERRITORIES } from "@/lib/constants";
import { catalogueTerritories } from "@/lib/rights";
import type { AssetType, Movie, VerificationStatus } from "@/types";

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

function ExternalText({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-start gap-1 text-ink-soft underline decoration-line underline-offset-2 transition-colors hover:text-gold"
    >
      <span>{label}</span>
      <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function TerritoryCell({ codes }: { codes: string[] }) {
  if (codes.length === 0) {
    return <span className="text-[12px] text-ink-muted">Not recorded</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {codes.map((code) => (
        <abbr
          key={code}
          title={TERRITORIES.find((territory) => territory.code === code)?.name ?? code}
          className="rounded-xs border border-line bg-white/[0.03] px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.08em] text-ink-soft no-underline"
        >
          {code}
        </abbr>
      ))}
    </span>
  );
}

/**
 * Auto-generated attribution table: every film, every asset, every licence and
 * verified territory in the catalogue. Server component — no client state.
 */
export function RightsTable({ movies }: { movies: Movie[] }) {
  const assetCount = movies.reduce(
    (total, movie) => total + movie.rights.assetRights.length,
    0,
  );
  const territories = catalogueTerritories(movies);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-xl leading-snug text-ink sm:text-2xl">
            Every asset record
          </h3>
          <p className="mt-1.5 cm-tabular text-[12.5px] text-ink-muted">
            {assetCount} records across {movies.length} films · verified territories:{" "}
            {territories.length > 0 ? territories.join(", ") : "none recorded"}
          </p>
        </div>
        <p className="text-[11.5px] text-ink-muted">
          Licences are recorded as published by each source.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <div className="cm-scroll overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-left">
            <caption className="sr-only">
              Rights records for every asset in the Cinemora catalogue, grouped by film:
              asset type, licence, source link, verified territories and verification date.
            </caption>
            <thead>
              <tr className="border-b border-line bg-elevated/70 text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Film
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Asset
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Licence
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Source
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Verified territories
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Verified
                </th>
              </tr>
            </thead>

            {movies.map((movie) => (
              <tbody key={movie.slug} className="border-b border-line/60 last:border-0">
                {movie.rights.assetRights.map((asset, assetIndex) => (
                  <tr
                    key={asset.assetType}
                    className="align-top transition-colors hover:bg-white/[0.02]"
                  >
                    {assetIndex === 0 ? (
                      <th
                        scope="rowgroup"
                        rowSpan={movie.rights.assetRights.length}
                        className="px-4 py-4 align-top"
                      >
                        <Link
                          href={`/movie/${movie.slug}`}
                          className="font-display text-[13.5px] leading-snug text-ink underline-offset-4 transition-colors hover:text-gold hover:underline"
                        >
                          {movie.title}
                        </Link>
                        <span className="mt-0.5 block cm-tabular text-[11px] text-ink-muted">
                          {movie.year}
                        </span>
                      </th>
                    ) : null}

                    <td className="px-4 py-4">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] text-ink">
                          {ASSET_LABEL[asset.assetType]}
                        </span>
                        <Badge tone={STATUS_TONE[asset.status]}>{asset.status}</Badge>
                      </span>
                    </td>

                    <td className="max-w-[18rem] px-4 py-4 text-[12px] leading-relaxed text-ink-soft">
                      {asset.licenseUrl ? (
                        <ExternalText href={asset.licenseUrl} label={asset.license} />
                      ) : (
                        asset.license
                      )}
                    </td>

                    <td className="max-w-[16rem] px-4 py-4 text-[12px] leading-relaxed text-ink-soft">
                      <ExternalText href={asset.sourceUrl} label={asset.source} />
                    </td>

                    <td className="px-4 py-4">
                      <TerritoryCell codes={asset.verifiedTerritories} />
                    </td>

                    <td className="px-4 py-4 text-[12px] leading-relaxed text-ink-soft">
                      <span className="cm-tabular">{asset.verifiedAt ?? "—"}</span>
                      {asset.verifiedBy ? (
                        <span className="mt-0.5 block text-[10.5px] text-ink-muted">
                          {asset.verifiedBy}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
        <abbr title="ISO 3166-1 alpha-2 country codes" className="no-underline">
          Two-letter territory codes
        </abbr>{" "}
        follow ISO 3166-1. An empty territory list means verification is still pending — those
        assets are not used for playback.
      </p>
    </div>
  );
}
