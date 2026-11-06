# NetMirror APK — static analysis (REA)

This folder is the **research record** produced while investigating a third-party streaming
app. It is deliberately kept *out* of the application source tree: nothing here is imported,
bundled or served by CINEMORA.

> **Why it exists:** to understand how these apps deliver video before deciding what CINEMORA
> should be. The conclusion was that the app is a WebView wrapper around rotating unlicensed
> mirror domains — so CINEMORA was built as a public-domain catalogue instead. See
> [`../../README.md`](../../README.md) for the product and [`../SPEC.md`](../SPEC.md) for the
> design specification.

---

## Target

| | |
| --- | --- |
| File | `artifacts/NetMirror_Updated.apk` (local only, not committed) |
| Size | 51,709,633 bytes |
| SHA-256 | `70af4ac2a7ec38b06de4fcb6d18dcbdf7ddc2095bb8129f0f84860dcb995dc0c` |
| Tooling | REA (rea-agents v6.8.0) MCP server |
| Date | 2026-11-06 |
| Method | static only — APK inventory, Hermes bytecode, native library strings. No device, no dynamic capture, no network interception. |

## Deliverables in this folder

| Path | Contents |
| --- | --- |
| [`ANALYSIS_SUMMARY.md`](ANALYSIS_SUMMARY.md) | Condensed findings, architecture table, limitations, recommended next steps |
| [`NetMirror_Analysis.txt`](NetMirror_Analysis.txt) | Full narrative: APK structure, technology stack, streaming mechanism, mirror-domain decoding |
| [`scripts/extract_urls.ps1`](scripts/extract_urls.ps1) | Extracts candidate URLs/base64 blobs from APK contents |
| [`scripts/search_streaming.ps1`](scripts/search_streaming.ps1) | Greps the bundle for streaming/auth keywords |
| `artifacts/` | Local-only binaries and extracted trees (git-ignored, ~160 MB) |

## Findings in one paragraph

NetMirror is a **React Native (Hermes) app** whose UI is a single `index.android.bundle`
(1,215,512 bytes of Hermes bytecode). It does not contain a video player or stream URLs: it
loads a **WebView** (the `libappmodules.so` strings include `RNCWebViewEventEmitter`,
`allowsInlineMediaPlayback`, `mediaPlaybackRequiresUserAction`) pointed at a mirror site and
plays video through that site's own web player. A plaintext `https://netmirror.app/settings`
fragment acts as a config/mirror list, and the bundle carries a family of base64-encoded
`mobidetect.*` / `mobidetects.*` fallback domains (`.ink`, `.in`, `.app`, `.top`, `.xyz`,
`.art`, `.cc`, `.info`, `.pro`, `.store`). No `.m3u8`/`.mpd` manifests, no DRM licence server
and no per-title media URLs are present in the APK — everything is fetched live.

## Limitations

- The JS bundle is Hermes bytecode; readable source recovery needs a tool such as Wakaru.
- Native library analysis was limited to string extraction (no Ghidra/Hopper provider was configured).
- No runtime capture was performed, so per-title endpoints and request signing remain unknown.
- Titles and content availability were therefore never enumerable from the APK alone.

## Ethics

This analysis was performed on a local file for interoperability and research. It does not
grant any right to redistribute the mirrored content, and **CINEMORA does not use any of it**:
the published site streams only works that are in the public domain, sourced from the Internet
Archive, with per-asset licence records.

## Artifact manifest (local only)

`artifacts/` is excluded from version control because it is ~160 MB of binaries and extracted
trees that nobody needs to clone the site:

| Path | Size |
| --- | --- |
| `NetMirror_Updated.apk` | 49.3 MB |
| `apk_extract/` | 52.8 MB (538 files) |
| `NetMirror_extracted/` | 52.2 MB (192 files) |
| `libreactnative_arm64.so` | 6.3 MB |
| `NetMirror_index.bundle` | 1.2 MB |
| `libappmodules_arm64.so` | 0.6 MB |
| `domains.txt`, `streaming_urls.txt` | 17 KB |

`NetMirror_Updated.zip` was byte-identical to the APK (same SHA-256) and was removed.

To reproduce, place the APK at `artifacts/NetMirror_Updated.apk` and verify the digest above,
then run the scripts in `scripts/` from the repository root.
