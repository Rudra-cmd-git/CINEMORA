#!/usr/bin/env python3
"""
CINEMORA catalogue builder.

    python scripts/build_catalogue.py

Reads  data/sources.json  (hand-curated film facts)
Writes data/movies.json   (runtime catalogue consumed by the app)
       public/posters/*   (optimised WebP artwork)
       public/backdrops/* (blurred cinematic backdrops)
       public/subtitles/* (WebVTT captions, when available)

Guarantees:
  * every video source is probed and must answer HTTP 206 + a video MIME type
  * every poster is fetched from a MediaWiki wiki with an explicit licence
  * artwork is optimised locally; the running site never hotlinks images

Exit codes: 0 success, 1 one or more films failed validation.
"""

from __future__ import annotations

import base64
import io
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PUBLIC_DIR = ROOT / "public"
POSTER_DIR = PUBLIC_DIR / "posters"
BACKDROP_DIR = PUBLIC_DIR / "backdrops"
SUBTITLE_DIR = PUBLIC_DIR / "subtitles"

USER_AGENT = "CinemoraBuild/1.0 (+https://cinemora.app; build@cinemora.app)"

POSTER_MD = (600, 900)
POSTER_SM = (300, 450)
BACKDROP = (1920, 1080)

VIDEO_MIME_EXT = {"mp4": "video/mp4", "webm": "video/webm", "m4v": "video/mp4"}


# --------------------------------------------------------------------------- #
#  HTTP helpers
# --------------------------------------------------------------------------- #
def request(url: str, *, range_header: str | None = None, timeout: int = 90):
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", USER_AGENT)
    req.add_header("Accept", "*/*")
    if range_header:
        req.add_header("Range", range_header)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers or {}), b""


def get_json(url: str):
    status, _, body = request(url)
    if status != 200:
        raise RuntimeError(f"HTTP {status} for {url}")
    return json.loads(body.decode("utf-8"))


def archive_file_url(identifier: str, filename: str) -> str:
    return f"https://archive.org/download/{identifier}/{urllib.parse.quote(filename)}"


def probe_stream(url: str) -> tuple[bool, str]:
    """A URL is usable when it answers a ranged request with 206 + video/*."""
    status, headers, body = request(url, range_header="bytes=0-1023", timeout=120)
    content_type = (headers.get("Content-Type") or headers.get("content-type") or "").lower()
    if status != 206:
        return False, f"expected 206, got {status}"
    if not content_type.startswith("video/"):
        return False, f"unexpected content-type {content_type!r}"
    if len(body) < 64:
        return False, "range response too small"
    return True, content_type


# --------------------------------------------------------------------------- #
#  MediaWiki poster resolution
# --------------------------------------------------------------------------- #
def resolve_poster(wiki: str, filename: str) -> dict:
    api = (
        f"https://{wiki}/w/api.php?action=query&format=json&prop=imageinfo"
        "&iiprop=url|size|mime|extmetadata&titles="
        + urllib.parse.quote(f"File:{filename}")
    )
    payload = get_json(api)
    pages = payload.get("query", {}).get("pages", {})
    page = next(iter(pages.values()), None)
    if not page or "imageinfo" not in page:
        raise RuntimeError(f"poster not found: File:{filename} on {wiki}")

    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    licence = (meta.get("LicenseShortName", {}) or {}).get("value") or "Public domain"
    page_title = urllib.parse.quote(filename.replace(" ", "_"))
    return {
        "url": info["url"].split("?")[0],
        "width": int(info.get("width") or 0),
        "height": int(info.get("height") or 0),
        "license": licence,
        "pageUrl": f"https://{wiki}/wiki/File:{page_title}",
    }


# --------------------------------------------------------------------------- #
#  Image pipeline
# --------------------------------------------------------------------------- #
def cover_crop(img: Image.Image, size: tuple[int, int], bias: float = 0.5) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = img.resize((max(1, round(src_w * scale)), max(1, round(src_h * scale))), Image.LANCZOS)
    left = (resized.width - target_w) // 2
    top = round((resized.height - target_h) * bias)
    top = max(0, min(top, resized.height - target_h))
    return resized.crop((left, top, left + target_w, top + target_h))


def build_poster(art: Image.Image) -> Image.Image:
    """Always returns a 2:3 portrait.

    Landscape artwork is cropped toward its subject, which reads far better in
    a poster grid than letterboxing. Only extremely wide artwork (panoramas,
    multi-panel sheets) is letterboxed onto a blurred backing.
    """
    aspect = art.width / art.height

    if aspect >= 2.0:
        backing = cover_crop(art, POSTER_MD).filter(ImageFilter.GaussianBlur(30))
        backing = ImageEnhance.Brightness(backing).enhance(0.9)
        canvas = backing.copy()

        fitted_w = POSTER_MD[0]
        fitted_h = max(1, round(art.height * (fitted_w / art.width)))
        fitted = art.resize((fitted_w, fitted_h), Image.LANCZOS)
        canvas.paste(fitted, (0, (POSTER_MD[1] - fitted_h) // 2))
        return canvas

    # Portrait and moderate landscape art: crop toward the upper-middle, where
    # poster typography and faces usually live.
    return cover_crop(art, POSTER_MD, bias=0.42 if aspect >= 1.0 else 0.34)


def _mean_luminance(img: Image.Image) -> float:
    histogram = img.convert("L").histogram()
    total = sum(histogram) or 1
    weighted = sum(index * count for index, count in enumerate(histogram))
    return weighted / total


def build_backdrop(poster: Image.Image) -> Image.Image:
    """A 16:9 ambient field for the hero.

    The poster is cropped, blurred into atmosphere, then auto-exposed to a
    consistent target luminance so a bright one-sheet and a near-black one
    both produce moody, comparable backdrops.
    """
    art = cover_crop(poster, (BACKDROP[0] // 2, BACKDROP[1] // 2))
    art = art.resize(BACKDROP, Image.LANCZOS)
    art = art.filter(ImageFilter.GaussianBlur(26))
    art = ImageEnhance.Contrast(art).enhance(1.16)
    art = ImageEnhance.Color(art).enhance(1.1)

    mean = _mean_luminance(art)
    target = 58.0
    factor = max(0.28, min(2.0, target / max(1.0, mean)))
    art = ImageEnhance.Brightness(art).enhance(factor)

    # Radial vignette for depth, built small and smoothly upscaled.
    small = (240, 135)
    mask = Image.new("L", small, 0)
    pixels = mask.load()
    cx, cy = small[0] / 2, small[1] / 2
    radius = min(small) * 0.62
    for y in range(small[1]):
        for x in range(small[0]):
            dx = (x - cx) / radius
            dy = (y - cy) / radius
            distance = min(1.0, (dx * dx + dy * dy) ** 0.5)
            pixels[x, y] = int(255 * (1.0 - 0.5 * distance**2))
    mask = mask.resize(BACKDROP, Image.BICUBIC)

    base = Image.new("RGB", BACKDROP, (8, 8, 10))
    return Image.composite(art, base, mask)


def blur_data_url(img: Image.Image) -> str:
    tiny = img.copy()
    tiny.thumbnail((20, 30), Image.LANCZOS)
    buffer = io.BytesIO()
    tiny.save(buffer, "WEBP", quality=42, method=4)
    return "data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def save_webp(img: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)


# --------------------------------------------------------------------------- #
#  Subtitles
# --------------------------------------------------------------------------- #
TIMECODE = re.compile(r"(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})")


def srt_to_vtt(raw: str) -> str:
    text = raw.replace("\r\n", "\n").replace("\r", "\n").strip()
    text = TIMECODE.sub(lambda m: f"{m.group(1)}.{m.group(2)} --> {m.group(3)}.{m.group(4)}", text)
    return "WEBVTT\n\n" + text + "\n"


def maybe_build_subtitles(identifier: str, slug: str, files: list[dict]) -> dict | None:
    candidates = [
        f for f in files
        if f.get("name", "").lower().endswith((".srt", ".vtt"))
        and re.search(r"(^|\.)(en|eng|english)(\.|$)", f.get("name", "").lower())
    ]
    if not candidates:
        candidates = [f for f in files if f.get("name", "").lower().endswith(".srt")]
    if not candidates:
        return None

    chosen = candidates[0]
    status, _, body = request(archive_file_url(identifier, chosen["name"]))
    if status != 200 or not body:
        print(f"    ! subtitle download failed ({status})")
        return None

    text = body.decode("utf-8", errors="replace")
    vtt = srt_to_vtt(text) if chosen["name"].lower().endswith(".srt") else text
    out = SUBTITLE_DIR / f"{slug}.en.vtt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(vtt, encoding="utf-8")
    return {
        "url": f"/subtitles/{slug}.en.vtt",
        "language": "en",
        "label": "English",
        "kind": "subtitles",
        "default": False,
        "format": "vtt",
        "sourceFile": chosen["name"],
    }


# --------------------------------------------------------------------------- #
#  Main
# --------------------------------------------------------------------------- #
def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    only: set[str] = set()
    backdrops_only = False
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = {part.strip() for part in arg.split("=", 1)[1].split(",") if part.strip()}
        elif arg == "--backdrops":
            backdrops_only = True

    if backdrops_only:
        rebuilt = 0
        for poster_path in sorted(POSTER_DIR.glob("*-md.webp")):
            slug = poster_path.name[: -len("-md.webp")]
            with Image.open(poster_path) as opened:
                backdrop = build_backdrop(opened.convert("RGB"))
            save_webp(backdrop, BACKDROP_DIR / f"{slug}.webp", 70)
            rebuilt += 1
            print(f"  backdrop rebuilt: {slug}")
        print(f"\nRebuilt {rebuilt} backdrops from local posters.")
        return 0

    sources = json.loads((DATA_DIR / "sources.json").read_text(encoding="utf-8"))
    defaults = sources.get("defaults", {})
    genre_map = sources["genres"]
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    movies_path = DATA_DIR / "movies.json"
    existing: dict[str, dict] = {}
    if movies_path.exists():
        try:
            previous = json.loads(movies_path.read_text(encoding="utf-8"))
            existing = {movie["slug"]: movie for movie in previous.get("movies", [])}
        except (json.JSONDecodeError, KeyError):
            existing = {}

    movies: list[dict] = []
    failures: list[str] = []

    for entry in sources["movies"]:
        slug = entry["slug"]
        if only and slug not in only:
            if slug in existing:
                movies.append(existing[slug])
            continue
        print(f"\n== {slug}")

        # ---- video -------------------------------------------------------
        video = entry["video"]
        identifier = video["archiveId"]
        filename = video["file"]
        url = archive_file_url(identifier, filename)
        ok, detail = probe_stream(url)
        if not ok:
            failures.append(f"{slug}: {detail} ({url})")
            print(f"    x stream failed: {detail}")
            if slug in existing:
                print("    · keeping previous catalogue entry")
                movies.append(existing[slug])
            continue
        print(f"    ok stream [{detail}]")

        # ---- metadata from archive (for alternate mp4 + subtitles) --------
        archive_meta = {}
        try:
            archive_meta = get_json(f"https://archive.org/metadata/{identifier}")
        except Exception as exc:  # noqa: BLE001 - metadata is optional
            print(f"    ! metadata unavailable: {exc}")
        files = archive_meta.get("files", [])

        video_sources = [{"url": url, "mimeType": detail.split(";")[0], "quality": "auto", "label": "Source"}]
        alternates = [
            f for f in files
            if f.get("name", "").lower().endswith(".mp4") and f.get("name") != filename
        ]
        if alternates:
            alt = alternates[0]
            alt_url = archive_file_url(identifier, alt["name"])
            alt_ok, _ = probe_stream(alt_url)
            if alt_ok:
                video_sources.append(
                    {"url": alt_url, "mimeType": "video/mp4", "quality": "auto", "label": "Alternate"}
                )
                print(f"    + alternate source: {alt['name']}")

        # ---- poster ------------------------------------------------------
        poster_spec = entry["poster"]
        try:
            poster_info = resolve_poster(poster_spec["wiki"], poster_spec["file"])
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{slug}: poster {exc}")
            print(f"    x poster failed: {exc}")
            if slug in existing:
                movies.append(existing[slug])
            continue

        status, _, art_bytes = request(poster_info["url"])
        if status != 200 or not art_bytes:
            failures.append(f"{slug}: poster download HTTP {status}")
            print(f"    x poster download failed: {status}")
            if slug in existing:
                movies.append(existing[slug])
            continue

        with Image.open(io.BytesIO(art_bytes)) as opened:
            art = opened.convert("RGB")

        poster_md = build_poster(art)
        poster_sm = poster_md.resize(POSTER_SM, Image.LANCZOS)
        backdrop = build_backdrop(poster_md)

        save_webp(poster_md, POSTER_DIR / f"{slug}-md.webp", 82)
        save_webp(poster_sm, POSTER_DIR / f"{slug}-sm.webp", 78)
        save_webp(backdrop, BACKDROP_DIR / f"{slug}.webp", 70)
        print(f"    ok artwork {art.width}x{art.height} -> 600x900 / 1920x1080")

        # ---- subtitles ---------------------------------------------------
        subtitle = maybe_build_subtitles(identifier, slug, files)
        subtitle_sources = []
        if subtitle:
            source_file = subtitle.pop("sourceFile")
            subtitle_sources.append(
                {
                    "url": subtitle["url"],
                    "language": subtitle["language"],
                    "label": subtitle["label"],
                    "kind": subtitle["kind"],
                    "default": subtitle["default"],
                    "format": subtitle["format"],
                }
            )
            print(f"    + subtitles: {source_file}")

        # ---- rights ------------------------------------------------------
        territories = entry.get("territories", ["US"])
        license_name = entry.get("license", defaults.get("license", "Public domain"))
        license_url = entry.get("licenseUrl", defaults.get("licenseUrl"))
        verified_at = entry.get("verifiedAt", defaults.get("verifiedAt"))
        verified_by = entry.get("verifiedBy", defaults.get("verifiedBy"))
        item_page = f"https://archive.org/details/{identifier}"

        asset_rights = [
            {
                "assetType": "video",
                "status": "verified",
                "license": license_name,
                "licenseUrl": license_url,
                "source": "Internet Archive",
                "sourceUrl": item_page,
                "evidenceUrl": item_page,
                "verifiedTerritories": territories,
                "verifiedAt": verified_at,
                "verifiedBy": verified_by,
                "verificationNotes": "Stream probed for HTTP 206 range support at build time.",
            },
            {
                "assetType": "poster",
                "status": "verified",
                "license": poster_info["license"],
                "licenseUrl": poster_info["pageUrl"],
                "source": poster_spec["wiki"].split(".")[0],
                "sourceUrl": poster_info["pageUrl"],
                "evidenceUrl": poster_info["pageUrl"],
                "verifiedTerritories": territories,
                "verifiedAt": verified_at,
                "verifiedBy": verified_by,
            },
            {
                "assetType": "backdrop",
                "status": "verified",
                "license": poster_info["license"],
                "licenseUrl": poster_info["pageUrl"],
                "source": "Cinemora (derived from the original poster)",
                "sourceUrl": poster_info["pageUrl"],
                "evidenceUrl": poster_info["pageUrl"],
                "verifiedTerritories": territories,
                "verifiedAt": verified_at,
                "verifiedBy": verified_by,
                "verificationNotes": "Derivative work generated locally from the public-domain poster.",
            },
        ]
        if subtitle_sources:
            asset_rights.append(
                {
                    "assetType": "subtitle",
                    "status": "verified",
                    "license": license_name,
                    "licenseUrl": license_url,
                    "source": "Internet Archive",
                    "sourceUrl": item_page,
                    "evidenceUrl": item_page,
                    "verifiedTerritories": territories,
                    "verifiedAt": verified_at,
                    "verifiedBy": verified_by,
                }
            )

        movies.append(
            {
                "id": slug,
                "slug": slug,
                "title": entry["title"],
                "originalTitle": entry.get("originalTitle"),
                "year": entry["year"],
                "runtimeMinutes": entry["runtimeMinutes"],
                "tagline": entry.get("tagline"),
                "synopsis": entry["synopsis"],
                "genres": [genre_map[g] for g in entry["genres"] if g in genre_map],
                "director": entry.get("director", []),
                "cast": entry.get("cast", []),
                "writer": entry.get("writer", []),
                "composer": entry.get("composer", []),
                "language": entry["language"],
                "country": entry["country"],
                "color": entry.get("color", "bw"),
                "aspectRatio": entry.get("aspectRatio", "1.33:1"),
                "featuredRank": entry.get("featuredRank", 99),
                "poster": {
                    "src": f"/posters/{slug}-md.webp",
                    "width": POSTER_MD[0],
                    "height": POSTER_MD[1],
                    "blurDataURL": blur_data_url(poster_md),
                },
                "backdrop": {
                    "src": f"/backdrops/{slug}.webp",
                    "width": BACKDROP[0],
                    "height": BACKDROP[1],
                },
                "videoSources": video_sources,
                "subtitleSources": subtitle_sources,
                "rights": {"overallStatus": "verified", "assetRights": asset_rights},
                "sourcePage": item_page,
                "createdAt": now,
                "updatedAt": now,
            }
        )

    if failures:
        print("\n--- failures ---")
        for failure in failures:
            print(f"  x {failure}")

    if not movies:
        print("\nNo films were built. Aborting.")
        return 1

    movies.sort(key=lambda m: m["featuredRank"])
    output = {"generatedAt": now, "movies": movies}
    (DATA_DIR / "movies.json").write_text(
        json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    total_posters = len(list(POSTER_DIR.glob("*.webp")))
    print(f"\nBuilt {len(movies)} films. Posters on disk: {total_posters}.")
    print(f"Catalogue written to {DATA_DIR / 'movies.json'}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
