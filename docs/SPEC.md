# CINEMORA — Phase 1: Requirements & Design Specification

**Status:** DRAFT — Awaiting Approval  
**Version:** 1.2  
**Date:** 2026-11-06  
**Last Revised:** 2026-11-06 (technical consistency review — rights model, Phase 2 scope, dependencies, hosting, territory)

---

## 1. Project Overview

| Property | Value |
|----------|-------|
| **Name** | CINEMORA |
| **Tagline** | *Cinema, curated* |
| **Vision** | A premium, cinematic movie-streaming platform for public-domain and freely-licensed films |
| **Target Platforms** | Desktop, tablet, mobile (responsive) |
| **Deployment** | Vercel (free tier) |
| **Repository** | GitHub (private → public on launch) |

---

## 2. Architecture

### 2.1 High-Level Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 (App Router)              │
├─────────────────────────────────────────────────────────────┤
│  React 18  │  TypeScript 5  │  Tailwind CSS 3  │  shadcn/ui │
├─────────────────────────────────────────────────────────────┤
│  Data Layer: Local JSON catalogue + localStorage (Phase 1)  │
│  Future:  Supabase / PocketBase / Firebase (Phase 4+)       │
├─────────────────────────────────────────────────────────────┤
│  Video: Native HTML5 <video> with multi-source URLs         │
│  Hosting: Configurable external provider (R2, Bunny, IA)    │
│  Adaptive: HLS.js deferred until Phase 4+                   │
│  Icons: Lucide React                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure

```
cinemora/
├── public/
│   ├── posters/                # Movie artwork (local, small assets only)
│   ├── backdrops/              # Hero/backdrop images (local, optimized)
│   ├── subtitles/              # .vtt files (local, small)
│   └── samples/                # Short legally-distributable test clips only
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth routes (future)
│   │   ├── (main)/             # Main app layout group
│   │   │   ├── explore/        # Explore movies
│   │   │   ├── genre/[slug]/   # Genre pages
│   │   │   ├── movie/[slug]/   # Movie detail (slug-based routing)
│   │   │   ├── player/[slug]/  # Video player (slug-based routing)
│   │   │   ├── search/         # Search results
│   │   │   ├── watchlist/      # My watchlist
│   │   │   ├── continue/       # Continue watching
│   │   │   └── about/          # About & copyright
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── layout/             # Header, Footer, Nav
│   │   ├── movie/              # MovieCard, Carousel, Banner
│   │   ├── player/             # VideoPlayer, Controls
│   │   └── common/             # Loader, Error, EmptyState
│   ├── lib/
│   │   ├── catalogue.ts        # Movie data access
│   │   ├── storage.ts          # localStorage helpers
│   │   ├── utils.ts            # Formatters, validators
│   │   └── constants.ts        # Genres, config
│   ├── hooks/
│   │   ├── useWatchlist.ts
│   │   ├── usePlaybackProgress.ts
│   │   └── useSearch.ts
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types
│   └── styles/
│       └── design-tokens.css   # CSS custom properties
├── data/
│   └── movies.json             # Movie catalogue
├── .github/workflows/          # CI/CD
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

### 2.3 Data Model

```typescript
// types/index.ts

// === Video & Asset Sources ===

export interface VideoSource {
  url: string;                    // External URL (R2, Bunny CDN, Internet Archive, etc.)
  mimeType: string;               // "video/mp4", "video/webm", "application/x-mpegURL"
  quality?: '1080p' | '720p' | '480p' | '360p' | 'auto';
  codec?: string;                 // "avc1.42E01E", "vp9", "hevc"
  label?: string;                 // "1080p H.264", "720p WebM"
  isHLS?: boolean;                // True for .m3u8 manifests
}

export interface SubtitleSource {
  url: string;                    // External or local /subtitles/...
  language: string;               // ISO 639-1
  label: string;                  // "English", "Español"
  kind: 'subtitles' | 'captions';
  default: boolean;
  format: 'vtt' | 'srt';          // WebVTT preferred for HTML5
}

export interface ImageAsset {
  url: string;                    // Local /public/... or external CDN
  width: number;
  height: number;
  format: 'jpg' | 'webp' | 'avif';
  blurDataUrl?: string;           // Base64 tiny placeholder for next/image
}

// === Rights & Verification (Per-Asset) ===

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface AssetRights {
  assetType: 'video' | 'poster' | 'backdrop' | 'soundtrack' | 'subtitle' | 'promo';
  status: VerificationStatus;
  license: string;                // e.g., "Public Domain (US)", "CC-BY-SA 4.0", "Custom"
  source: string;                 // "Internet Archive", "Wikimedia Commons", "Self-hosted"
  sourceUrl: string;              // Direct link to source page
  licenseUrl?: string;            // Link to license text
  verifiedTerritories: string[];  // ISO 3166-1 codes where verified; EMPTY = unverified/unknown
  evidenceUrl?: string;           // Link to verification evidence (screenshot, PDF, correspondence)
  verificationNotes?: string;     // Free-text notes on verification process/limitations
  verifiedAt?: string;            // ISO 8601 (only when status === 'verified')
  verifiedBy?: string;            // Verifier identifier
}

export interface MovieRightsSummary {
  overallStatus: VerificationStatus;        // 'verified' only if ALL required assets verified
  requiredAssetsVerified: boolean;          // Video + at least one subtitle (if applicable) verified
  displayAssetsVerified: boolean;           // Poster + backdrop verified for public display
  assetRights: AssetRights[];               // One per asset type
  // Derived playback permission — NOT a stored field; computed at runtime
  // Use canPlay(movie, territory) helper instead of reading this
  territoryChecked?: string;                // ISO 3166-1 code of territory last checked
}

// === Playback Gating Logic (pure functions, no stored booleans) ===

// Assets required for VIDEO PLAYBACK
const PLAYBACK_REQUIRED_TYPES: AssetRights['assetType'][] = ['video', 'subtitle'];

// Assets required for PUBLIC DISPLAY (poster, backdrop in catalogues)
const DISPLAY_REQUIRED_TYPES: AssetRights['assetType'][] = ['poster', 'backdrop'];

function isAssetVerifiedForTerritory(asset: AssetRights, territory: string): boolean {
  return asset.status === 'verified' && asset.verifiedTerritories.includes(territory);
}

function canPlay(movie: Movie, userTerritory: string): boolean {
  // Video playback requires: video source verified + at least one subtitle verified (if subtitles exist)
  const videoAsset = movie.rights.assetRights.find(a => a.assetType === 'video');
  if (!videoAsset || !isAssetVerifiedForTerritory(videoAsset, userTerritory)) {
    return false;
  }
  // If film has subtitle sources, at least one must be verified for territory
  if (movie.subtitleSources.length > 0) {
    const subtitleAssets = movie.rights.assetRights.filter(a => a.assetType === 'subtitle');
    const hasVerifiedSubtitle = subtitleAssets.some(a => isAssetVerifiedForTerritory(a, userTerritory));
    if (!hasVerifiedSubtitle) return false;
  }
  return true;
}

function canDisplay(movie: Movie, userTerritory: string): boolean {
  // Public display (poster/backdrop in catalogues) requires display assets verified
  // Note: This is separate from playback permission
  return DISPLAY_REQUIRED_TYPES.every(type => {
    const asset = movie.rights.assetRights.find(a => a.assetType === type);
    return asset && isAssetVerifiedForTerritory(asset, userTerritory);
  });
}

// Usage: In MovieCard/HeroBanner — check canDisplay() before rendering artwork
// In Player page — check canPlay() before rendering <video> or showing Play button

// === Core Entities ===

export interface Genre {
  id: string;                    // "horror", "silent", "expressionist"
  name: string;
  slug: string;
  description?: string;
}

export interface CastMember {
  name: string;
  role: string;
  photo?: ImageAsset;
}

export interface Movie {
  id: string;                    // UUID v4 (internal)
  slug: string;                  // URL-safe: "nosferatu-1922" — used for /movie/[slug]
  title: string;
  originalTitle?: string;
  year: number;
  runtimeMinutes: number;
  genres: Genre[];
  synopsis: string;
  tagline?: string;
  
  // Media (external URLs or local optimized assets)
  poster: ImageAsset;
  backdrop: ImageAsset;
  videoSources: VideoSource[];   // Multiple formats/qualities; first playable used
  hlsManifest?: string;          // Optional .m3u8 URL for adaptive streaming (Phase 4+)
  subtitleSources: SubtitleSource[];
  
  // Credits
  director: string[];
  cast: CastMember[];
  writer?: string[];
  composer?: string[];
  
  // Rights & Attribution (REQUIRED — per-asset)
  rights: MovieRightsSummary;
  
  // Metadata
  imdbId?: string;
  tmdbId?: number;
  language: string;              // ISO 639-1 (primary audio)
  country: string;               // ISO 3166-1 (production country)
  color: 'color' | 'bw' | 'tinted';
  aspectRatio: string;           // e.g., "1.33:1"
  
  // Timestamps
  createdAt: string;             // ISO 8601
  updatedAt: string;
}

// === Client-Side State (localStorage — ONLY in 'use client' components) ===

export interface WatchlistItem {
  movieSlug: string;             // Reference by slug (stable, readable)
  addedAt: string;               // ISO 8601
}

export interface PlaybackProgress {
  movieSlug: string;             // Reference by slug
  currentTime: number;           // Seconds (float)
  duration: number;              // Total seconds
  completed: boolean;            // >= 90% of duration watched
  lastWatchedAt: string;         // ISO 8601
  playbackRate: number;          // Last used speed (1.0 default)
}

// === Playback Rules ===

// Completion: currentTime / duration >= 0.9
// Progress saved on: timeupdate (throttled 2s), pause, ended, beforeunload
// Resume: On player mount, seek to saved currentTime if > 30s and < duration - 30s
// Reset: "Restart from beginning" button clears progress for that movie
// Cross-device: Not supported in MVP (localStorage only)
```

---

## 3. Design System

### 3.1 Color Palette

```css
/* styles/design-tokens.css */

:root {
  /* === Core Neutrals === */
  --color-bg-deep: #0a0a0b;           /* Near-black base */
  --color-bg-elevated: #121214;        /* Cards, modals */
  --color-bg-hover: #1a1a1d;           /* Hover states */
  --color-border: #2a2a2e;             /* Subtle borders */
  --color-border-focus: #4a4a50;       /* Focus rings */
  
  /* === Text === */
  --color-text-primary: #fafafa;       /* Headlines */
  --color-text-secondary: #c4c4c7;     /* Body, metadata */
  --color-text-muted: #88888e;         /* Captions, disabled */
  --color-text-inverse: #0a0a0b;       /* On accent */
  
  /* === Cinematic Accents === */
  --color-gold: #d4a843;               /* Primary brand */
  --color-gold-dim: #b8923a;           /* Hover */
  --color-gold-light: #e8c57a;         /* Active */
  --color-crimson: #a61e2d;            /* Alerts, "New" badges */
  --color-teal: #14a897;               /* Success, "Playing" */
  
  /* === Gradients === */
  --gradient-hero: linear-gradient(180deg, rgba(10,10,11,0) 0%, #0a0a0b 100%);
  --gradient-card: linear-gradient(180deg, rgba(18,18,20,0) 0%, #121214 100%);
  --gradient-gold: linear-gradient(135deg, #d4a843 0%, #b8923a 100%);
  --gradient-crimson: linear-gradient(135deg, #a61e2d 0%, #8b1a24 100%);
  
  /* === Shadows === */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.5);
  --shadow-xl: 0 24px 48px rgba(0,0,0,0.6);
  --shadow-glow-gold: 0 0 24px rgba(212,168,67,0.3);
  
  /* === Radius === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* === Transitions === */
  --transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* === Spacing Scale (4px base) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  
  /* === Typography === */
  --font-display: 'Cinzel', 'Georgia', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */
  
  --leading-tight: 1.1;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* === Z-Index === */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
}
```

### 3.2 Typography Scale

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| **Hero Title** | Cinzel | 60px / 3.75rem | 600 | 1.1 | -0.02em |
| **Section Title** | Cinzel | 30px / 1.875rem | 500 | 1.2 | -0.01em |
| **Movie Title (Card)** | Inter | 14px / 0.875rem | 500 | 1.3 | 0 |
| **Movie Title (Detail)** | Cinzel | 36px / 2.25rem | 500 | 1.2 | -0.01em |
| **Body Large** | Inter | 18px / 1.125rem | 400 | 1.6 | 0 |
| **Body** | Inter | 16px / 1rem | 400 | 1.5 | 0 |
| **Body Small** | Inter | 14px / 0.875rem | 400 | 1.5 | 0 |
| **Caption** | Inter | 12px / 0.75rem | 400 | 1.4 | 0.02em |
| **Button** | Inter | 14px / 0.875rem | 500 | 1 | 0.01em |
| **Metadata** | Inter | 13px / 0.8125rem | 400 | 1.4 | 0 |

### 3.3 Component Specifications

#### 3.3.1 MovieCard

```
┌─────────────────────────────────────────┐
│  ████████████████████████████████████  │  ← Poster (2:3 ratio) — placeholder if unverified
│  ████████████████████████████████████  │
│  ████████████████████████████████████  │
├─────────────────────────────────────────┤
│  Movie Title                          │  ← Title only
│  1922 • 1h 34m • Horror, Silent       │  ← Metadata
│  ████████░░░░░░░░░░░░░░░░░░░░░ 45%    │  ← Progress bar (if watched, Phase 3+)
└─────────────────────────────────────────┘
```

**States:**
- Default: Subtle border, no transform
- Hover: Scale 1.02, border gold, shadow-lg
- Focus: Gold focus ring (accessibility)
- Loading: Skeleton shimmer
- **Rights badge**: Small indicator — ⚠ Pending / ❌ Unavailable / ✓ Verified
- **Phase 2**: NO Play button, NO Watchlist button, NO overlay actions — card is display-only
- **Phase 3+**: On verified films, hover overlay reveals "Play" + "Watchlist" actions

**Artwork Policy:** If `canDisplay(movie, territory)` is false, render a branded placeholder (CINEMORA pattern + film title) instead of the poster. Never display unverified artwork.

#### 3.3.2 HeroBanner (Homepage) — Responsive Typography

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Backdrop with gradient overlay (placeholder if unverified)
│    ░  NOSFERATU                           1922           ░  │
│    ░  A Symphony of Horror                            ░  │
│    ░  1h 34m • Horror, Silent, Expressionist            ░  │
│    ░                                                       ░  │
│    ░  [Rights Status: Pending Verification]              ░  │
│    ░                                                       ░  │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────────────────────────────┘
```

**Responsive Hero Title Sizes:**
| Breakpoint | Viewport | Font Size | Line Height | Max Width |
|------------|----------|-----------|-------------|-----------|
| Mobile     | < 640px  | 2.5rem (40px) | 1.1 | 90vw |
| Tablet     | 640–1023px | 3.5rem (56px) | 1.1 | 70vw |
| Desktop    | ≥ 1024px | 4.5rem (72px) | 1.1 | 60ch |

Tagline scales: Mobile 1.125rem → Tablet 1.25rem → Desktop 1.375rem
Metadata: Consistent 1rem across breakpoints

**Phase 2**: No CTA buttons. Display rights status badge (Pending/Verified/Unavailable).
**Phase 3+**: On verified films — CTA Buttons: Full-width stacked on mobile, inline on tablet+ ("Play", "Watchlist", "More")

**Artwork Policy:** If `canDisplay(movie, territory)` is false, render a branded gradient placeholder with film title/year instead of backdrop. Never display unverified backdrop artwork.

#### 3.3.3 HorizontalCarousel (Phase 2) / ResponsiveGrid (Phase 3+)

**Phase 2 — HorizontalCarousel (Homepage only):**
- **Desktop**: 6 cards visible, scroll-snap, 24px gap, arrow nav (keyboard accessible)
- **Tablet**: 4 cards visible, scroll-snap, 20px gap, touch scroll + arrow nav
- **Mobile**: 2.5 cards visible (peek), touch scroll, no arrows
- **Content**: Fixed initial catalogue (10 films), no infinite scroll
- **Accessibility**: Arrow keys navigate, focus management, ARIA labels

**Phase 3+ — ResponsiveGrid (Explore / Genre pages):**
- **Desktop (≥1280px)**: 5 columns, 24px gap
- **Tablet (768–1279px)**: 3 columns, 20px gap
- **Mobile (<768px)**: 2 columns, 16px gap
- **No infinite scroll** — simple pagination or "Load More" button for larger catalogues
- **Genre filter**: Client-side sidebar (desktop) / modal drawer (mobile)

#### 3.3.4 VideoPlayer (Phase 4 — Spec for Reference)

```
┌─────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████  │  ← <video> element (no native controls)
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │  ← Custom accessible controls (overlay)
│  │ ▶⏸  12:34 / 1:34:22  ████████████░░░░░░░░  ☐ 🔊  ⛶  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Architecture:**
- **Single control system**: Accessible custom controls ONLY (native `controls` attribute REMOVED)
- **HTML5 `<video>`** with multiple `<source>` elements for format fallback
- **HLS.js**: Deferred to Phase 4+ (not in MVP); if used, loads dynamically only when `.m3u8` source detected

**Behavior Specification:**

| Interaction | Behavior |
|-------------|----------|
| **Play/Pause** | Space / K / Click video area / Tap (mobile) |
| **Seek ±10s** | ← / → / J / L / Double-tap left/right (mobile) |
| **Seek to %** | Number keys 0–9 (0=0%, 9=90%) |
| **Volume** | ↑ / ↓ / M (mute) / Volume slider |
| **Fullscreen** | F / Double-click / ⛶ button / iOS: native fullscreen API |
| **Playback Rate** | Shift+> / Shift+< / Menu: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x |
| **Subtitles** | C / Menu: cycle languages / Off |
| **Quality** | Menu (only if multiple non-HLS sources) |
| **PiP** | P / Menu button (where supported) |
| **Auto-hide** | Controls fade after 3s pointer inactivity; show on move/tap/focus |
| **Progress Save** | Throttled `timeupdate` (2s), `pause`, `ended`, `beforeunload` → localStorage |
| **Resume** | On mount: if saved `currentTime` > 30s AND < `duration - 30s`, auto-seek + toast "Resume from 12:34?" |
| **Error Handling** | `error` event → show retry button, log code, fallback to next source |
| **Range Requests** | Host MUST support HTTP Range (206) for seeking; validated in sample test |
| **Codecs** | Primary: H.264/MP4 (universal). Fallback: VP9/WebM. AV1/HEVC only with verified support. |

**Accessibility:**
- All controls: `<button>` with `aria-label`, focus visible (gold ring)
- Live region for time announcements
- Captions: `<track kind="captions">` + custom menu
- Keyboard trap in fullscreen (Tab cycles controls)
- `prefers-reduced-motion`: disable auto-hide animation

#### 3.3.5 Navigation Bar

```
┌────────────────────────────────────────────────────────────────┐
│  ◄CINEMORA►  [Explore] [Genres ▼] [Watchlist] [Continue]  🔍  │
└────────────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────┐
│ ◄CINEMORA►        ☰  │
└────────────────────────┘
☰ → Slide-out drawer with same links + Search
```

---

## 4. Feature Specification

### 4.1 Core Features (MVP - Phase 1-4)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | Homepage | Hero banner + 3-4 genre carousels + "Continue Watching" | P0 |
| F2 | Explore | Responsive grid of all movies, client-side genre filter, no infinite scroll | P0 |
| F3 | Genre Pages | Filtered movie grid + genre description | P0 |
| F4 | Movie Detail | Full metadata, cast, "Play" CTA (gated by rights), watchlist toggle | P0 |
| F5 | Video Player | HTML5 player with accessible custom controls, subtitles, progress save | P0 |
| F6 | Search | Real-time title search with debounce, results page | P0 |
| F7 | Watchlist | Add/remove, persistent (localStorage), dedicated page | P0 |
| F8 | Continue Watching | Auto-track progress, resume from timestamp, dedicated page | P0 |
| F9 | About/Copyright | Attribution page, license info, source links, verification status | P0 |
| F10 | Responsive Nav | Hamburger menu, drawer, touch-friendly | P0 |
| F11 | Loading States | Skeletons, spinners, progressive image loading | P1 |
| F12 | Error Boundaries | Graceful error UI, retry actions | P1 |
| F13 | Empty States | Illustrative empties for watchlist, search, continue | P1 |
| F14 | Keyboard Nav | Full keyboard accessibility | P1 |
| F15 | SEO Meta | Open Graph, Twitter Cards, JSON-LD | P1 |

### 4.2 Future Enhancements (Post-MVP)

| ID | Feature | Notes |
|----|---------|-------|
| F16 | User Accounts | Supabase Auth, sync watchlist/progress |
| F17 | HLS Streaming | Adaptive bitrate for large files |
| F18 | Recommendations | "Because you watched..." |
| F19 | Collections | Curated lists (e.g., "Silent Masterpieces") |
| F20 | Offline Download | Service Worker + IndexedDB |
| F21 | Multiple Profiles | Family sharing |
| F22 | Parental Controls | Content ratings |
| F23 | Chromecast/AirPlay | Sender SDK |
| F24 | Analytics | Privacy-respecting (Plausible) |

---

## 5. Content Strategy & Copyright Compliance

### 5.1 Initial Film Candidates (All Pending Verification)

| Film | Year | Source Candidate | Rights Claim | Status |
|------|------|------------------|--------------|--------|
| Nosferatu | 1922 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |
| The Cabinet of Dr. Caligari | 1920 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |
| Metropolis | 1927 | Internet Archive | Public Domain (US, restored) | ⏳ Pending Verification |
| The General | 1926 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |
| Safety Last! | 1923 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |
| Sunrise: A Song of Two Humans | 1927 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |
| The Phantom of the Opera | 1925 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |
| Nosferatu (1979) | 1979 | Wikimedia Commons | CC-BY-SA 4.0 | ⏳ Pending Verification |
| Night of the Living Dead | 1968 | Internet Archive | Public Domain (US, no notice) | ⏳ Pending Verification |
| Carnival of Souls | 1962 | Internet Archive | Public Domain (US) | ⏳ Pending Verification |

**Target: 10 films for Phase 2-3 development, 25 for launch** — prioritizing horror, silent, expressionist, noir, sci-fi classics.

**⚠ CRITICAL: No film may be publicly playable until ALL required asset rights (video + subtitles) are verified for the target territory. An empty `verifiedTerritories` array means UNKNOWN, NOT worldwide permission.**

### 5.2 Per-Asset Verification Requirements

For EACH film, the following assets require SEPARATE rights verification:

| Asset Type | Verification Required | Evidence Examples |
|------------|----------------------|-------------------|
| **Video (primary)** | Mandatory | Source page showing license, correspondence with rights holder, public domain determination |
| **Video (alternate formats)** | If hosted separately | Same as primary |
| **Poster / Key Art** | Mandatory | Source page, license text, creator release |
| **Backdrop / Hero Image** | Mandatory | Source page, license text, derivative work rights |
| **Soundtrack / Score** | If separate from video | Score publication status, recording rights |
| **Subtitles / Captions** | Mandatory if included | Subtitle file license, translator rights, source |
| **Promotional Artwork** | If used | Same as poster |

**Verification Dossier per Film (stored in `/data/verification/` or external):**
- `film-slug-verification.md` with:
  - Asset table (type, source URL, license, territory, status)
  - Screenshots of source pages (dated)
  - Correspondence records (if any)
  - Verifier name, date, territory checked
  - `verifiedTerritories` list (ISO 3166-1) — ONLY territories explicitly confirmed

### 5.3 Attribution Display Requirements

Every movie page **MUST** display (footer or dedicated "Rights" section):
- Per-asset attribution: "Video: Internet Archive (Public Domain US)" etc.
- License type + URL per asset
- Verification date + verifier per asset
- `verifiedTerritories` list (or "Unverified for your region")
- Link to full verification dossier

**Playback Gate Logic (client-side, derived from asset rights — NO stored booleans):**
```typescript
// Assets required for playback
const PLAYBACK_REQUIRED_TYPES = ['video', 'subtitle'] as const;

// Assets required for public display (catalogue posters/backdrops)
const DISPLAY_REQUIRED_TYPES = ['poster', 'backdrop'] as const;

function isAssetVerifiedForTerritory(asset: AssetRights, territory: string): boolean {
  return asset.status === 'verified' && asset.verifiedTerritories.includes(territory);
}

function canPlay(movie: Movie, userTerritory: string): boolean {
  const videoAsset = movie.rights.assetRights.find(a => a.assetType === 'video');
  if (!videoAsset || !isAssetVerifiedForTerritory(videoAsset, userTerritory)) return false;
  if (movie.subtitleSources.length > 0) {
    const subtitleAssets = movie.rights.assetRights.filter(a => a.assetType === 'subtitle');
    if (!subtitleAssets.some(a => isAssetVerifiedForTerritory(a, userTerritory))) return false;
  }
  return true;
}

function canDisplay(movie: Movie, userTerritory: string): boolean {
  return DISPLAY_REQUIRED_TYPES.every(type => {
    const asset = movie.rights.assetRights.find(a => a.assetType === type);
    return asset && isAssetVerifiedForTerritory(asset, userTerritory);
  });
}
```

**UI Behavior:**
| Check | If `false` | If `true` |
|-------|------------|-----------|
| `canDisplay()` | Show placeholder artwork + "Rights pending" badge | Render poster/backdrop normally |
| `canPlay()` | Hide Play button; show "Not available in your region" or "Rights verification pending" | Show Play button; allow navigation to player |

**No stored `playbackAllowed` boolean** — permission is always derived from current asset rights + territory.

---

### 5.5 Territory Detection & Access Control Limitations

**Territory detection in CINEMORA is a UX convenience, NOT a rights enforcement mechanism.**

| Method | Purpose | Reliability |
|--------|---------|-------------|
| Browser `Intl.DateTimeFormat().resolvedOptions().timeZone` → country heuristic | Default territory pre-selection | Low — timezone ≠ legal jurisdiction; users travel, use VPNs, or have misconfigured systems |
| User-selected territory (stored in localStorage) | Explicit user choice | Medium — user may select incorrectly; no identity verification |
| IP geolocation (paid service) | Optional enhancement | Low-Medium — VPN/proxy bypass; not authoritative |

**Critical:** Client-side `canPlay()` / `canDisplay()` checks **do not prevent** a determined user from accessing video URLs directly (via DevTools, network inspection, or direct link sharing). They are **UI gates only**.

**True rights enforcement requires:**
- Signed/tokenized URLs with expiry (Cloudflare R2 Workers, Bunny CDN token auth)
- Backend verification of user territory against license terms
- DRM/encrypted streams for commercial content (not applicable to PD/CC films)

**CINEMORA MVP Scope:** Client-side gating only. Document limitation. Future: signed URLs + backend verification if required by licensors.

### 5.4 Asset Acquisition Checklist

- [ ] **Sample test clip**: Short (≤30s), legally distributable clip for player testing (e.g., NASA footage, CC0 film clip)
- [ ] Video files: Source highest quality from verified sources; store URLs only
- [ ] Posters: Restore/upscale from public domain artwork; optimize (WebP, multiple sizes)
- [ ] Backdrops: Create cinematic crops from key frames; optimize
- [ ] Subtitles: Source from OpenSubtitles (verify license) or create; **convert SRT → WebVTT** for HTML5 `<track>` compatibility (SRT not natively supported)
- [ ] Metadata: Cross-reference IMDb, TMDb, Wikipedia
- [ ] Rights verification: Complete per-asset dossier for each film BEFORE adding to playable catalogue
- [ ] **HTTP Range validation**: Test 206 Partial Content support with selected host before Phase 4

---

## 6. Implementation Plan by Phase

### Phase 1: Requirements & Design ✅ **THIS DOCUMENT**
- [x] Architecture specification
- [x] Design system (colors, typography, components)
- [x] Data model
- [x] Feature specification
- [x] Content strategy
- [ ] **Approval gate** → Proceed to Phase 2

### Phase 2: Project Foundation & Homepage ONLY (Week 1-2)

**Scope Boundary: NO Phase 3/4 features. No authentication, no video player, no recommendations, no HLS, no admin.**

| Task | Description | Deliverable |
|------|-------------|-------------|
| 2.1 | Initialize Next.js 14 + TS + Tailwind + shadcn/ui (copy-paste) | `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `.eslintrc.json` |
| 2.2 | Set up design tokens (CSS custom properties) | `src/styles/design-tokens.css` imported in `globals.css` |
| 2.3 | Create base UI primitives (Button, Card, Input, Badge, Avatar, Separator, Skeleton, Tooltip, DropdownMenu, Sheet) | `src/components/ui/*` — only components needed for Phase 2 |
| 2.4 | Build layout components: Header (logo, nav, search, mobile drawer), Footer (links, attribution), MainLayout wrapper | `src/components/layout/*` |
| 2.5 | Implement MovieCard, HorizontalCarousel, HeroBanner | `src/components/movie/*` |
| 2.6 | Create initial sample catalogue (10 films) with **pending rights status** + TypeScript types | `data/movies.json`, `src/types/index.ts` |
| 2.7 | Build Homepage: HeroBanner (first film) + 3 HorizontalCarousel sections (by genre) + "Continue Watching" placeholder | `src/app/page.tsx` |
| 2.8 | Responsive navigation: Desktop header + Mobile drawer (Sheet) + Search input (UI only, no logic) | Header component |
| 2.9 | Add loading skeletons (MovieCard, HeroBanner) + ErrorBoundary wrapper | `src/components/common/*` |
| 2.10 | Responsive testing: Desktop (≥1280), Tablet (768), Mobile (375) — all components functional | Test checklist + screenshots |
| 2.11 | Git checkpoint: "Phase 2 complete - Foundation & Homepage" | Commit + tag `v0.2.0-foundation` |

**Explicitly NOT in Phase 2:**
- ❌ `/movie/[slug]` detail page
- ❌ `/explore` page
- ❌ `/genre/[slug]` pages
- ❌ `/search` page
- ❌ VideoPlayer component
- ❌ Watchlist / Continue Watching pages
- ❌ localStorage hooks (useWatchlist, usePlaybackProgress)
- ❌ Search logic
- ❌ HLS.js
- ❌ Admin/dashboard

### Phase 3: Movie Catalogue & Details (Week 2-3)
| Task | Description | Deliverable |
|------|-------------|-------------|
| 3.1 | Explore page with responsive grid + client-side genre filter | `src/app/(main)/explore/page.tsx` |
| 3.2 | Dynamic genre pages `[slug]` with filtered grid | `src/app/(main)/genre/[slug]/page.tsx` |
| 3.3 | Movie detail page `/movie/[slug]` with full metadata, rights display, watchlist toggle, play CTA (gated by rights) | `src/app/(main)/movie/[slug]/page.tsx` |
| 3.4 | Search page with debounced input + results grid | `src/app/(main)/search/page.tsx` |
| 3.5 | `useSearch` hook + catalogue search logic (client-side) | `src/hooks/useSearch.ts` |
| 3.6 | `useWatchlist` hook (localStorage, slug-based) + toggle button | `src/hooks/useWatchlist.ts` |
| 3.7 | SEO meta tags + JSON-LD for all pages | Layout metadata |
| 3.8 | Git checkpoint: "Phase 3 complete - Catalogue working" | Commit + tag `v0.3.0-catalogue` |

### Phase 4: Video Player & User Features (Week 3-4)
| Task | Description | Deliverable |
|------|-------------|-------------|
| 4.1 | VideoPlayer component: native `<video>` + accessible custom controls (single control system), multi-source, WebVTT subtitles, keyboard/touch, progress persistence | `src/components/player/VideoPlayer.tsx` |
| 4.2 | Player page `/player/[slug]` with URL param `?t=seconds` for deep linking | `src/app/(main)/player/[slug]/page.tsx` |
| 4.3 | `usePlaybackProgress` hook (localStorage, slug-based, throttled saves) | `src/hooks/usePlaybackProgress.ts` |
| 4.4 | Subtitle support: `<track>` elements + custom menu, language selector | Player component |
| 4.5 | Watchlist page (moved from Phase 3) | `src/app/(main)/watchlist/page.tsx` |
| 4.6 | Continue Watching page + homepage row | `src/app/(main)/continue/page.tsx` |
| 4.7 | About/Copyright page with full per-asset attribution + verification status | `src/app/(main)/about/page.tsx` |
| 4.8 | Keyboard shortcuts + accessibility audit (player + global) | Player + global |
| 4.9 | Sample video test: Verify HTTP Range, codec support, seeking, mobile playback | Test report |
| 4.10 | Git checkpoint: "Phase 4 complete - Player + features working" | Commit + tag `v0.4.0-player` |

### Phase 5: Testing & Optimization (Week 4-5)
| Task | Description | Deliverable |
|------|-------------|-------------|
| 5.1 | Cross-browser testing (Chrome, Firefox, Safari, Edge) | Test report |
| 5.2 | Mobile device testing (iOS Safari, Chrome Android) | Test report |
| 5.3 | Lighthouse audit (Performance, Accessibility, SEO) | Scores ≥ 90 |
| 5.4 | Bundle analysis + code splitting optimization | Reduced JS |
| 5.5 | Image optimization (next/image, WebP, blur placeholders) | Optimized assets |
| 5.6 | Error boundary testing + edge cases | Fixed bugs |
| 5.7 | Git checkpoint: "Phase 5 complete - Production ready" | Commit + tag |

### Phase 6: Deployment (Week 5)
| Task | Description | Deliverable |
|------|-------------|-------------|
| 6.1 | GitHub repository setup + branch protection | Repo configured |
| 6.2 | Vercel project + environment variables | Deployment working |
| 6.3 | Custom domain (optional) + SSL | Live URL |
| 6.4 | CI/CD: Lint, type-check, build on PR | GitHub Actions |
| 6.5 | Launch checklist + monitoring | Go/no-go decision |
| 6.6 | **Launch** 🎬 | `cinemora.app` (or similar) |

---

## 7. Technical Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Modern React patterns, Server Components, streaming, better SEO |
| **Local JSON + localStorage** | Zero backend cost, instant dev, portable; migrate to Supabase later. **localStorage accessed ONLY in 'use client' components.** |
| **shadcn/ui (copy-paste)** | Accessible, customizable. Required npm packages: `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, **`@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`, `@radix-ui/react-tooltip`, `@radix-ui/react-avatar`, `@radix-ui/react-separator`, `@radix-ui/react-dialog` (for Sheet)**. These Radix primitives are peer dependencies of shadcn/ui components and must be installed. |
| **Tailwind CSS** | Design token integration via CSS variables, rapid iteration, small bundle |
| **Native HTML5 Video + Custom Controls** | No player library bloat; single accessible control system; brand consistency. HLS.js deferred. |
| **CSS Variables for Design Tokens** | Themeable, no JS runtime, works with Tailwind `arbitrary values` (`bg-[var(--color-gold)]`) |
| **App Router Route Groups** | Clean separation: `(main)` for app pages, `(auth)` future. Root layout = providers + globals; `(main)` layout = header/footer/nav. |
| **localStorage for State** | Persistent across sessions, no auth needed for MVP. Slug-based keys (not IDs). |
| **External Video Hosting** | No large files in GitHub/Vercel. Provider **undecided** — options: Cloudflare R2, Bunny CDN, Internet Archive direct. URLs in JSON. HTTP Range (206) support MUST be validated with selected host in Phase 4 sample test. |
| **Per-Asset Rights Model** | Granular verification; prevents accidental playback of unverified content; territory-aware. |
| **Vercel Deployment** | Free tier, edge functions, image optimization, zero config |

---

## 8. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Video hosting costs / egress limits | Medium | High | Cloudflare R2 free tier (10 GB **storage**, Class A/B operations free; egress to Cloudflare network free, standard egress applies if not using Cloudflare proxy); monitor usage; fallback to Internet Archive direct links |
| Copyright claim on "PD" film | Low | Critical | Per-asset verification dossiers; territory-gated playback; DMCA process documented; `verifiedTerritories` explicit |
| Mobile video autoplay policies | High | Medium | Muted autoplay preview only; require tap for full player; `playsinline` attribute |
| Performance on low-end devices | Medium | High | Lazy-load images, code-split player (dynamic import), `prefers-reduced-motion`, optimize bundle |
| Browser codec support (HEVC, AV1) | Medium | Medium | Primary: H.264/MP4 (universal). Fallback: VP9/WebM. Transcode pipeline documented. |
| HTTP Range requests not supported by host | Medium | High | **Validated in Phase 4 sample test** before full catalogue; host must support 206 Partial Content |
| Scope creep | High | Medium | Strict phase gates; "nice-to-have" → backlog; Phase 2 boundary explicitly listed |
| Rights verification delays | High | Medium | Parallel track: legal verification during dev; placeholder films with pending status for UI development |
| localStorage cross-tab sync | Low | Low | Not required for MVP; document limitation; future: BroadcastChannel or Supabase |

---

## 9. Acceptance Criteria for Phase 1 Approval

- [ ] Architecture document reviewed and approved
- [ ] Design system (colors, typography, components, responsive specs) approved
- [ ] Feature scope (MVP) agreed — Phase 2 boundary explicitly understood
- [ ] Content strategy: 10 film candidates identified, all **Pending Verification**, per-asset rights model accepted
- [ ] Video architecture: External URLs only, provider undecided, sample test clip + HTTP Range test required before Phase 4
- [ ] Rights model: Per-asset verification, computed playback/display gating (no stored booleans), empty territories = unknown, client-side gating = UI convenience only
- [ ] Data model: `/movie/[slug]` routing, multi-source video, slug-based localStorage, playback rules defined
- [ ] Phase 2 timeline accepted (Week 1-2, foundation + homepage only — NO Play/Watchlist actions, NO player, NO hooks)
- [ ] Tech stack confirmed (shadcn/ui + Radix UI peer dependencies documented)

---

## 10. Next Steps

Upon approval of this specification:

1. **Initialize repository** with Next.js 14, TypeScript, Tailwind, shadcn/ui (copy-paste)
2. **Create design tokens** as CSS custom properties in `src/styles/design-tokens.css`
3. **Build UI primitive library** (Button, Card, Input, Badge, Avatar, Separator, Skeleton, Tooltip, DropdownMenu, Sheet)
4. **Develop layout shell** (Header with logo/nav/search/drawer, Footer, MainLayout wrapper)
5. **Implement movie components** (MovieCard, HorizontalCarousel, HeroBanner with responsive typography)
6. **Create initial sample catalogue** (10 films, all **Pending Verification**, per-asset rights structure)
7. **Build Homepage** (Hero + 3 genre carousels + Continue Watching placeholder)
8. **Responsive testing** (Desktop/Tablet/Mobile) — all buttons/nav functional
9. **Commit Phase 2 checkpoint** (`v0.2.0-foundation`)

**Unresolved Decisions Requiring Your Input:**
| Decision | Options | Recommendation |
|----------|---------|----------------|
| Video hosting provider | Cloudflare R2 (10 GB free storage), Bunny CDN (~$1/mo), Internet Archive direct | **Undecided** — evaluate based on HTTP Range support, signed URL capability, cost at scale |
| Sample test clip source | NASA footage (PD), CC0 film clip (Pexels), Internet Archive 30s clip | NASA/CC0 — zero rights risk for player testing |
| Territory detection | Browser timezone heuristic, IP geolocation (paid), user selection | User selection with browser heuristic default — no external dependency; **document as UX convenience only** |
| shadcn/ui components needed Phase 2 | Button, Card, Input, Badge, Avatar, Separator, Skeleton, Tooltip, DropdownMenu, Sheet | As listed — requires Radix UI peer deps (see Technical Decisions) |
| Genre taxonomy | Flat list vs hierarchical | Flat list (10-15 genres) for MVP; hierarchical later |

---

**Prepared by:** CINEMORA Development Team  
**Review Required:** Product / Design / Legal (copyright)  
**Decision:** ☐ Approved  ☐ Approved with Changes  ☐ Rejected