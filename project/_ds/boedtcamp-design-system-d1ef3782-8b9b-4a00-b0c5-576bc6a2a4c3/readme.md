# BoedtCamp Design System

BoedtCamp is a personal-training and lifestyle-coaching brand run by a strength & performance coach (background in basketball) based in Belgium (Dutch/Flemish copy throughout). The core audience is **couples and 50-plussers (adults 50+)** looking for sustainable lifestyle coaching, not just gym workouts. Tagline: **"Jouw levensstijl, mijn prioriteit"** ("Your lifestyle, my priority").

## Sources provided
- `uploads/presentation-01.jpg`, `presentation-01_new.jpg` — brand board (logo lockups, color palette, fonts, mockups).
- `uploads/file-01.svg` … `file-56.svg` — full logo-lockup export set (color/black/silver/mono, with/without tagline, circular badge, on light/dark).
- `uploads/Vrstva 1/2/3.svg` — the three coaching-pillar line icons (mind / strength / care).
- `uploads/Mindmap.pdf` — full website sitemap (pages, pillars, offer structure, socials).
- `uploads/162.png`, `Background for Template.png` — dark full-bleed brand background textures.
- `uploads/Board Laser-01.png` — physical laser-cut signage board (logo + chevron motif).
- `uploads/rm372-363-b08-google-mockup.png` — bottle merchandise mockup.
- No Figma file, codebase, or component library was attached — no existing UI screens exist yet, so the components below are an **intentional, from-scratch set** sized to a coaching marketing site, not a copied inventory.
- Referenced but **not actually attached** (mentioned in the brief only): `Boedtcamp.pdf`, `28180.png`, `logo vector file_new.ai`. Ask the user to attach these if a vector master logo or a fuller brand PDF is needed.

## What BoedtCamp offers (from the sitemap)
- **Lifestyle Coach** — built on 3 pillars: *Gezonde Levensstijl* (healthy lifestyle: voeding/nutrition + slapen/sleep), *Scherpe Geest* (sharp mind: mindfulness, meditation, work-life balance), *Sporten* (movement). Offered to individuals and to companies (workshops).
- **Personal Trainer** — 1-on-1 or duo (couples), in nature, at the BoedtCamp Studio, or at home.
- **Sport Coach** — training schedules + guidance, incl. basketball performance coaching.
- **Resources** — blog, client stories (klantenverhalen), events, active on Facebook/Instagram/LinkedIn/TikTok/Spotify.

## Components
- **Button** (`components/core`) — pill CTA, variants primary/dark/secondary/ghost.
- **Badge** (`components/core`) — uppercase eyebrow/tag pill, tones blue/dark/outline.
- **Card** (`components/core`) — generic elevated surface, light/dark.
- **PillarCard** (`components/marketing`) — icon + title + copy, built for the 3 coaching pillars. *Intentional addition.*
- **TestimonialCard** (`components/marketing`) — dark client-quote card. *Intentional addition.*
- **SectionHeading** (`components/marketing`) — eyebrow + italic headline + intro copy. *Intentional addition.*

## Index
- `styles.css` — global stylesheet entry (imports `tokens/*.css`).
- `tokens/` — colors, typography, spacing/radius, font-face imports.
- `assets/logo/` — logo lockups & marks (color, black, silver, circular badge).
- `assets/icons/` — the 3 pillar icons.
- `assets/imagery/` — backgrounds, signage board photo, merch mockup.
- `assets/brandboard/` — original brand board reference images.
- `components/core/`, `components/marketing/` — React primitives, see above.
- `guidelines/` — foundation specimen cards (Design System tab: Colors, Type, Spacing, Brand).
- `ui_kits/website/` — click-through marketing site recreation (home page).
- `SKILL.md` — portable skill file for Claude Code.

## Content fundamentals
- **Language**: Dutch/Flemish (Belgium). All UI copy and marketing text should be written in Dutch unless the user asks otherwise.
- **Voice**: direct, warm, coach-like — second person ("jouw", "je") addressing the client personally, never distant corporate "u". The tagline itself models this: *"Jouw levensstijl, mijn prioriteit"* — a personal promise, not a slogan about the company.
- **Tone**: motivational and grounded rather than hype-driven — no exclamation-heavy fitness-influencer energy. Reads like a coach who takes your goals seriously (works well for the 50+ / couples audience, which skews toward trust and reassurance over intensity).
- **Casing**: sentence case for body copy and headlines (not Title Case). The wordmark itself is a stylized exception ("BoedtCamp").
- **Emoji**: not used anywhere in the source material — do not introduce emoji.
- **Structure of the offer copy**: benefit-led pillar names ("Scherpe Geest", "Gezonde Levensstijl", "Sporten") rather than clinical program names; short noun-phrase labels, not full sentences, in navigation/menus.

## Visual foundations
- **Color**: primary brand color is a blue gradient (`#2C9DFD → #1F5DC4`), used on the logo mark and as the main CTA/accent color. Secondary is a metallic silver gradient (`#FFFFFD → #666668`) used for a premium/steel alternate logo treatment. Black (`#000000`) is the dominant background for brand/hero moments. Neutral grays round out UI surfaces; there is no separate "warm" accent — the palette is cool and steel/sport-toned throughout.
- **Type**: display/headings in **Exo, Black Italic** (900 weight, always italic) — an angular, technical, sporty display face. Body copy in **Poppins** (Regular/Medium/SemiBold) — a rounder, friendly geometric sans that balances Exo's aggression. This pairing (aggressive italic display + soft geometric body) is the core brand typographic tension: performance edge + approachable coaching warmth.
- **Backgrounds**: brand materials favor **full-bleed black backgrounds** for hero/brand moments, often with a large, low-opacity watermark version of the logo mark bleeding off one corner, plus a thin chevron ("«««" arrow) pattern motif in the opposite corner — this chevron/arrow motif recurs across the banner, signage board, and background textures as the brand's one recurring graphic device (implies forward motion/progress). No hand-drawn illustration style; no repeating textures beyond this chevron; no gradients used decoratively in backgrounds (gradients are reserved for the logo mark and CTA buttons).
- **Imagery**: brand mockups (bottle, cap, building signage) are shot on clean neutral/gray studio backgrounds or real architectural photography (glass office facade) — cool, corporate-clean, not candid/lifestyle photography. No photography of people/training in the source material yet — treat as a gap; ask for real training/coaching photography before shipping a production site.
- **Iconography**: the only icon set provided is the **3 pillar icons** (mind/strength/care) — fine-line illustrative icons inside a solid blue circle, white linework, rounded stroke caps. Use this exact style (line icon in a filled blue circle) for any new pillar/feature icon; do not mix in a different icon font or style. No emoji, no unicode icons used anywhere in brand material.
- **Shape language**: the logo mark itself is built from sharp, angular triangular/chevron facets (no rounded corners in the mark) — but UI surfaces (buttons, cards) use soft rounded corners (pill buttons, 8–14px card radius), so angularity is reserved for the brand mark and background chevron motif, not for UI chrome.
- **Elevation**: cards use a soft two-layer shadow (tight contact shadow + broader ambient shadow), no borders on dark cards beyond a faint 8% white hairline; light cards get a 1px neutral border. No inner glow / neumorphism.
- **Motion**: no animation is specified in source materials — default to simple, fast (120–160ms) opacity/transform transitions for hover and press states (button brightens + scales down slightly on press; cards lift with a deeper shadow on hover). Nothing bouncy or elaborate.
- **Corners**: pill radius on buttons and badges; 8–14px on cards; the logo badge is fully circular.
- **Transparency/blur**: not used in source materials — avoid glassmorphism/blur effects.

## Iconography
- Only bespoke asset: the 3 pillar icons (`assets/icons/pillar-*.svg`) — solid blue circle, white line-art (brain+hand = Scherpe Geest, fist+dumbbell = Sporten, heart in hands = Gezonde Levensstijl).
- No icon font or UI icon set (nav chevrons, close buttons, etc.) was provided. **Substitution flagged**: use [Lucide](https://lucide.dev) (CDN) for any generic UI icon (menu, chevron, close, social) — its rounded-cap line weight matches the pillar icon style reasonably well. Do not invent new pillar-style icons by hand; ask for more from the brand if additional pillar/feature icons are needed.
- No emoji or unicode icon usage anywhere in source material.

## Fonts
Both fonts are available directly on Google Fonts with the exact weights/styles seen in the brand board — **no substitution needed**:
- Exo — weight 900 (Black), italic, for all display/heading use.
- Poppins — weights 400/500/600 for body copy.

Loaded via `tokens/fonts.css` (`@import` from Google Fonts CDN — no local binaries were provided to self-host).

## Caveats / open questions
- No vector master logo (.ai) or the full `Boedtcamp.pdf` brand doc was actually attached — only the raster brand-board JPGs and the exported SVG lockup set. If you have the original vector file, please attach it for the cleanest possible logo assets.
- No real photography of coaching/training sessions was provided — imagery in the UI kit uses placeholders; please share real photos for a production-ready site.
- No existing website/app UI to copy — the `ui_kits/website` recreation is an original layout built from the sitemap + brand board, not a pixel copy of an existing screen. Treat it as a strong starting point, not ground truth.
- Iconography beyond the 3 pillar icons is a CDN (Lucide) substitution — flagged above.

**Ask**: tell me which of these gaps matter most (real photography? the vector logo file? more pillar-style icons? a different page from the sitemap to prototype — e.g. the Personal Trainer or Sport Coach page?) and I'll iterate to get it production-ready.
