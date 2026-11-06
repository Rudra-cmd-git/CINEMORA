import { type NextRequest } from "next/server";

/**
 * Same-origin subtitle proxy.
 *
 * The films stream from archive.org, which does not send CORS headers for
 * `<track>` requests — and a `<track>` must be same-origin to be readable by
 * the video element. This route fetches the caption file server-side, validates
 * the host against a strict allowlist, normalises SRT to WebVTT, and returns it
 * from our own origin with a long-lived public cache.
 *
 * Security:
 * - Only `https://archive.org` and `https://*.archive.org` are fetchable
 *   (SSRF guard); anything else is a 400.
 * - The raw `url` query parameter is never echoed back in a response.
 * - Redirects are re-validated against the allowlist before the body is read.
 */

export const dynamic = "force-dynamic";

const ALLOWED_ROOT_DOMAIN = "archive.org";
const MAX_SUBTITLE_BYTES = 4 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
  "X-Content-Type-Options": "nosniff",
} as const;

function textError(message: string, status: number): Response {
  // Deliberately generic: never echo the caller-supplied URL.
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === ALLOWED_ROOT_DOMAIN || host.endsWith(`.${ALLOWED_ROOT_DOMAIN}`);
}

/** Validates a subtitle URL, returning the parsed URL or null when rejected. */
function parseAllowedUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  if (parsed.port !== "") return null;
  if (!isAllowedHost(parsed.hostname)) return null;

  return parsed;
}

/** Converts SubRip cue timing (`00:00:01,000`) into WebVTT timing. */
function srtToVtt(input: string): string {
  const lines = input.split("\n");
  const output: string[] = ["WEBVTT", ""];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    // Drop SubRip cue numbers: a bare integer directly above a timing line.
    if (/^\d+$/.test(line.trim())) {
      const next = lines[index + 1]?.trim() ?? "";
      if (next.includes("-->")) continue;
    }

    if (line.includes("-->")) {
      output.push(line.replace(/(\d),(\d)/g, "$1.$2"));
      continue;
    }

    output.push(line);
  }

  return `${output.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/** Guarantees a WebVTT document, converting SRT when the source is SRT. */
function normaliseSubtitle(text: string): string {
  const body = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (/^WEBVTT(?:\s|$)/.test(body)) return body;
  return srtToVtt(body);
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return textError("A 'url' query parameter is required.", 400);
  }

  const target = parseAllowedUrl(rawUrl);
  if (!target) {
    return textError("That subtitle URL is not allowed.", 400);
  }

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        Accept: "text/vtt, text/plain, application/octet-stream, */*",
        "User-Agent": "CinemoraSubtitlesProxy/1.0 (+https://cinemora.app)",
      },
      redirect: "follow",
      signal: abort.signal,
      // Cache the upstream body per URL for a day.
      next: { revalidate: 86_400 },
    });
  } catch {
    return textError("The subtitle source could not be reached.", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    return textError("The subtitle source returned an error.", 502);
  }

  // A redirect could point outside the allowlist — validate the final URL.
  try {
    const finalUrl = new URL(upstream.url);
    if (!isAllowedHost(finalUrl.hostname)) {
      return textError("The subtitle source redirected to a disallowed host.", 502);
    }
  } catch {
    return textError("The subtitle source returned an invalid response.", 502);
  }

  const declaredLength = Number(upstream.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SUBTITLE_BYTES) {
    return textError("The subtitle file is too large to proxy.", 502);
  }

  let raw: string;
  try {
    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_SUBTITLE_BYTES) {
      return textError("The subtitle file is too large to proxy.", 502);
    }
    raw = new TextDecoder("utf-8").decode(buffer);
  } catch {
    return textError("The subtitle source returned an unreadable response.", 502);
  }

  // Reject HTML error pages masquerading as subtitles.
  if (/<html[\s>]|<!doctype html/i.test(raw.slice(0, 512))) {
    return textError("The subtitle source did not return a subtitle file.", 502);
  }

  const vtt = normaliseSubtitle(raw);
  if (!vtt.trimStart().startsWith("WEBVTT")) {
    return textError("The subtitle source is not a valid subtitle file.", 502);
  }

  return new Response(vtt, {
    status: 200,
    headers: {
      ...CACHE_HEADERS,
      "Content-Type": "text/vtt; charset=utf-8",
    },
  });
}
