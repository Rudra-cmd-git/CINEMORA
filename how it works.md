# How NetMirror.plus Provides Free Access to Paid Movies and Series

## Executive Summary

NetMirror.plus is a **content aggregator/frontend** that does NOT host any media files. It provides free access to paid content by embedding video players from third-party streaming services and requiring a browser extension to bypass browser security restrictions.

---

## Core Architecture

### 1. No Content Hosting
- **Explicitly stated in their Terms of Service and DMCA policy:**
  - "NetMirror does not host any media files on its servers"
  - "All media content is embedded from third-party services that are not under our control"
  - "NetMirror does not host, upload, or store any video files on its servers"

### 2. Third-Party Video Embedding via Iframes
The site embeds external video players from these domains:
- watch20.online/play/ - Live sports/IPL streaming
- watch-download.shop/watchbox/artplayerlive.php - Live streaming player  
- webvp.watch21.shop/play/external.php - Main video player for movies/TV series
- tmdb.imdb3.shop - TMDB API proxy for metadata

### 3. TMDB Metadata Integration
Uses **TMDB (The Movie Database) API** via a proxy to fetch:
- Movie/TV show metadata (titles, posters, descriptions, ratings)
- Season/episode lists
- Search functionality
- Multiple API keys rotated to avoid rate limits (Gm array in code)

### 4. External Video Player Integration
Playback URL construction:
const J = "?tm_id=" + t + (e==="tv"?"&se=" + s + "&ep=" + c:"") + "&tm_type=" + e;
const L = "&ts=" + $ + "&sig=" + P + "&exten=" + k;
const Q = "https://webvp.watch21.shop/play/external.php" + J + L;
The S3(t) function generates iframe signatures for the external player.

### 5. Browser Extension Requirement (Critical)
**The site REQUIRES a browser extension to function:**
- Chrome: https://chromewebstore.google.com/detail/netmirror-extension/imeeoinlogcehkhfjcopabijecfobcod
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/netmirror-web-extension/

The extension likely:
- Bypasses CORS restrictions for cross-origin iframe embedding
- Handles DRM/encrypted streams
- Manages cookies/authentication for embedded players
- Injects scripts into embedded iframe contexts

### 6. Ad Blocker / Private DNS Detection
Actively detects and blocks users with:
- Ad blockers (Monetag advertising network)
- Private DNS / DNS-level ad blocking
- Shows interstitial pages requiring disablement before access

### 7. Live Sports Streaming
Separate integration for live sports (IPL/cricket) via watch20.online with real-time match data.

### 8. Monetization
- **Monetag advertising** (mentioned in privacy policy)
- Popunder ads (code references disable-popunder-overlay)
- Telegram channel promotion (t.me/netmirror_web)

---

## Technical Flow

1. **User visits netmirror.plus** -> React SPA loads (built with Vite, React 18, React Router)
2. **Metadata fetch** -> App calls TMDB proxy API (tmdb.imdb3.shop) for movie/TV data
3. **User selects content** -> Route navigates to /movie/:id or /tv/:id or /watch/:type/:id
4. **Signature generation** -> S3(t) function creates signed iframe URL for external player
5. **Player embed** -> Iframe loads https://webvp.watch21.shop/play/external.php?tm_id=...&ts=...&sig=...&exten=...
6. **Extension intercepts** -> Browser extension handles CORS, DRM, cookies for the embedded player
7. **Video streams** -> Content plays from third-party source (watch21.shop, watch20.online, etc.)

---

## Legal Position (Per Their Own Policies)

| Policy | Key Statement |
|--------|---------------|
| **DMCA** | "NetMirror does not host any media files on its servers. All media content is embedded from third-party services" |
| **Terms of Service** | "NetMirror does not host, upload, or store any video files on its servers. All media content is provided by third-party services." |
| **Privacy** | Uses Google Firebase for auth/analytics; Monetag for advertising |
| **Takedown** | Email: support@netmirror.net - Claims 24-72 hour removal |

---

## Summary Table

| Aspect | Finding |
|--------|---------|
| **Content Hosting** | None - pure embed/aggregator |
| **Video Source** | Third-party streaming sites (watch21.shop, watch20.online, watch-download.shop) |
| **Metadata Source** | TMDB via proxy API (tmdb.imdb3.shop) |
| **Access Control** | Browser extension required (Chrome/Firefox) |
| **DRM Handling** | Delegated to external players/extension |
| **Legal Position** | DMCA policy claims no hosting, provides takedown email |
| **Monetization** | Monetag ads, popunders, Telegram promotion |

---

## Conclusion

NetMirror.plus operates as a **frontend aggregator** that:
1. Scrapes metadata from TMDB (via proxy)
2. Embeds players from third-party streaming services via iframes
3. Requires a browser extension to bypass browser security restrictions (CORS, Same-Origin Policy) that would normally block cross-origin iframe embedding of protected/encrypted content
4. Monetizes through aggressive advertising (Monetag, popunders)

The "free access" is achieved by **proxying/embedding content from other unauthorized streaming sources**, not by hosting or licensing content themselves.