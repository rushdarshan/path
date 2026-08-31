# Site DNA — Let's Code Resume Templates (https://www.lets-code.co.in/resume-templates/)

AUDIT_MODE: high-fidelity

> Running Phase 1 — Forensic Site Audit on https://www.lets-code.co.in/resume-templates/ in High-Fidelity Mode.
> Section-identification strategy: top-level divs under `<main>`/framework root `#__next > div` (site uses `<div>` architecture, not `<section>` tags; audit via framework root children + JS chunk reverse-engineering + live CSS)
> Source: live HTML + _next/static CSS (27b4d6b789fddb24.css / 63299683d97796cf.css) + page chunk page-8e8513ba85a17837.js + template data chunk 3272-6542fe0ef5e4b888.js. Full render is client (Next.js App Router), so audit is source-grounded, not screenshot-guessed.

---

## 1.1 — PAGE ARCHITECTURE

Total viewport sections: 9 (including global nav + footer)

Section-identification strategy used: top-level divs under main/framework root

```
╔══════════════════════════════════════════════════════╗
║  SECTION 1: Global Nav (sticky top)  HEIGHT: ~64px  ║
║  BG: white / dark: gray-900            LAYOUT: max-w-7xl centered flex row ║
╠══════════════════════════════════════════════════════╣
║  SECTION 2: Hero (dark emerald/black)  HEIGHT: ~420px desktop / auto mobile ║
║  BG: bg-gray-900 / from-gray-900 to-black / emerald halo ambient             ║
║  LAYOUT: max-w-5xl 2-col (left copy 60% / right fanned previews 40%)         ║
╠══════════════════════════════════════════════════════╣
║  SECTION 3: Filter Bar (pill tabs)     HEIGHT: ~72px                         ║
║  BG: white / dark gray-900 narrow strip                                      ║
║  LAYOUT: max-w-5xl flex-wrap gap-2                                           ║
╠══════════════════════════════════════════════════════╣
║  SECTION 4: Premium Upsell Banner      HEIGHT: ~88px                         ║
║  BG: gradient emerald-700 → green-800  LAYOUT: max-w-5xl rounded-2xl flex    ║
╠══════════════════════════════════════════════════════╣
║  SECTION 5: Template Grid (core)       HEIGHT: auto (grid)                   ║
║  BG: gray-50 / white                   LAYOUT: max-w-5xl grid sm:2 lg:3 gap-8 ║
╠══════════════════════════════════════════════════════╣
║  SECTION 6: "Already have a resume?" CTA HEIGHT: ~160px                      ║
║  BG: white card with border            LAYOUT: max-w-5xl centered            ║
╠══════════════════════════════════════════════════════╣
║  SECTION 7: "8 Free AI Career Tools"  HEIGHT: ~180px                         ║
║  BG: gray-50                           LAYOUT: max-w-5xl grid                ║
╠══════════════════════════════════════════════════════╣
║  SECTION 8: Footer (4-col)             HEIGHT: ~480px                        ║
║  BG: white / gray-50                   LAYOUT: max-w-7xl 4-col grid          ║
╠══════════════════════════════════════════════════════╣
║  SECTION 9: Bottom bar (copyright)     HEIGHT: ~56px                         ║
║  BG: border-t gray-200                 LAYOUT: centered flex                 ║
╚══════════════════════════════════════════════════════╝
```

OVERLAPPING sections: none — strictly stacked. Hero's right-side fanned cards use `transform: rotate() translateY()` but stay inside hero bounds; no negative-margin bleed between sections. Sticky nav overlaps hero on scroll (see 1.7).

Tall-section note: Template Grid is the only tall section (auto height, 6 cards → ~1100px). Children are homogeneous cards (see 1.3 exhaustive enumeration) — no orphan sub-sections.

---

## 1.2 — DESIGN TOKENS

```
PALETTE:
  "Background"        : hsl(0 0% 100%) / #FFFFFF              → page bg (CSS var --background)
  "Foreground/Ink"    : hsl(240 10% 3.9%) / #09090B            → primary text (var --foreground, --primary 240 5.9% 10%)
  "Muted FG"          : hsl(240 3.8% 46.1%) / #71717A         → secondary text, meta
  "Border"            : hsl(240 5.9% 90%)   / #E4E4E7         → card borders, dividers
  "Emerald Primary"   : #059669 / hsl(160 84% 39%) (emerald-600) → active filter pill bg, hover border, accents
  "Emerald Hover"     : #047857 (emerald-700) → banner gradient from, button hover
  "Emerald Light"     : #D1FAE5 (emerald-100) / emerald-900/40 dark → active tag inside cards
  "Gray-900 CTA"      : #111827 / gray-900                   → "Use This Template" button bg
  "Gray-700 Preview"  : from-gray-700 to-gray-900 etc        → per-template preview gradient (see card tokens)
  "White Card"        : #FFFFFF / dark: #1F2937 (gray-800)  → card bg
  "Pill Hover Text"   : emerald-600 on hover (light) / emerald-400 dark
  "Banner Gradient"   : from-emerald-700 (#047857) to-green-800 (#166534)
  "Overlay Hover"     : rgba(0,0,0,0.10) on card preview hover
  "Dark Mode Bg"      : hsl(240 10% 9%) / #18181B (dark --background)
  Template Accents (per-card):
    Classic      #111827  preview from-gray-700 to-gray-900
    Executive    #374151  from-gray-500 to-gray-700
    Clean        #1f2937  from-gray-400 to-gray-600
    Campus       #1e3a5f  from-blue-700 to-blue-900
    Sigma        #555555  from-zinc-400 to-zinc-600
    Harvard      #1a1a1a  from-stone-600 to-stone-900

TYPOGRAPHY SCALE:
  Role       | Font Family                         | Weight | Size                        | Tracking | Line-Height | Style
  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  Display    | __geistSans_1e4310 (Geist Sans)     | 800    | clamp(2.2rem, 5vw, 3.0rem)  | -0.02em  | 1.05        | normal
  Heading 2  | Geist Sans                           | 700    | 1.0rem (text-base)          | -0.01em  | 1.4         | normal
  Body       | Geist Sans                           | 400    | 0.875rem (text-sm) / 0.75rem (text-xs) | 0      | 1.6/1.5     | normal
  Label/Chips| Geist Sans                           | 500    | 0.75rem (text-xs) / 11px    | 0.02em   | 1.4         | normal
  Small Meta | Geist Sans                           | 400    | 0.75rem / 11px              | 0        | 1.5         | normal
  Mono/Data  | __geistMono_c3aa02 (Geist Mono)      | 400    | 0.75rem                     | 0        | 1.5         | normal
  ⚑ DRAMA NOTES: Hero drama is NOT a giant serif italic — it is weight contrast 800 vs 400 and color contrast (white headline on near-black) plus the fanned mini-resume composition. The headline "Resume Templates That Get You Hired" at ~36–48px / 800 / -0.02em tracking, 1.05 line-height, white on dark, is the anchor. Its power comes from tight tracking + tall x-height of Geist Sans at display size paired with the 3-card fanned composition to its right. Lose the -0.02em or drop weight to 700 and the hero goes flat. Body stays deliberately small (14px/12px) to make the hero feel editorial, not marketing.

SPACING GRID: Base unit = 4px. Tailwind scale: 4, 8, 12, 16, 24, 32, 48, 64. Container max-w-5xl (1024px) for content sections, max-w-7xl for nav/footer. Horizontal padding: px-4 (16px) sm:px-6 (24px) lg:px-8 (32px). Vertical: py-6 (24px) for filter/banner, pb-16 (64px) for grid bottom, gap-8 (32px) card grid, gap-4 (16px) hero fanned cards, gap-2 (8px) chips.
BORDER RADIUS: card: 16px (rounded-2xl) — used on template cards, banner, preview container; preview inner: 12px (rounded-xl) on fanned mini cards; pills: 9999px (rounded-full) on filter chips; button: 12px (rounded-xl) on "Use This Template"
SHADOW SYSTEM: default card: 0 1px 2px rgba(0,0,0,0.05) (shadow-sm) + border 1px solid #E4E4E7; hover: 0 20px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.04) (shadow-xl) + translateY(-4px); fanned mini: shadow-2xl + ring-1 ring-white/20
TEXTURE: none — flat colors + gradients only. No grain/noise overlay. Preview cards use `linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))` 48px fade at bottom edge.
```

---

## 1.3 — SECTION BLUEPRINTS

### SECTION 1: Global Nav

Height: ~64px | BG: white (dark: gray-900) + border-b gray-200 | Padding: 12px vertical, max-w-7xl

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  [Logo "Let's Code" 32px]  [Learn ▾] [PYQ's] [Interview] [Companies & Jobs] [Community]   [AI Tools] [Sign in] │
└─────────────────────────────────────────────────────┘
Layout system: Flexbox row, justify-between, gap-6, items-center
Gap: 24px between nav items
```

**TYPOGRAPHY + CONTENT MAP:**

```
  logo → "Let's Code" | Style: Body 16px / 700 | Color: foreground
  nav link → "Learn" / "PYQ's" / "Interview" / etc | Style: Label 14px / 500 | Color: muted-foreground → hover: foreground
  CTA → "Free · Sign in to edit & download" | Style: Label | BG: transparent
```

### SECTION 2: Hero

Height: ~420px desktop / auto mobile | BG: gray-900 → black (near-black) + ambient emerald glow (subtle) | Padding: py-12 lg:py-16

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────┐  │
│  │ LEFT 60%                 │  │ RIGHT 40%        │  │
│  │ h1: "Resume Templates     │  │ 3 fanned mini    │  │
│  │  That Get You Hired"     │  │ cards (110×150)  │  │
│  │ sub: "ATS-optimised..."  │  │ -5deg / 0 / +5deg│  │
│  │ [4 badges row]           │  │ labels: Classic  │  │
│  │                          │  │ Campus / Executive│ │
│  └──────────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
Layout system: Flex row (column on mobile), gap-8, items-center, max-w-5xl mx-auto px-4 sm:px-6 lg:px-8
Gap: 32px between columns
```

**TYPOGRAPHY + CONTENT MAP:**

```
  h1 → "Resume Templates That Get You Hired" | Style: Display 800 / clamp 2.2–3rem / white | Color: white
  sub → "ATS-optimised templates for software engineers, data scientists, and freshers. Edit online and download as PDF — free." | Style: Body 16px / 400 / gray-300 | Color: muted (light on dark)
  badge → "ATS-Optimised" / "PDF Download" / "Saves to Profile" / "Multiple Formats" | Style: Label 11px / 600 / emerald-200 on dark chip | BG: white/10
  mini label → "Classic" / "Campus" / "Executive" | Style: Label 11px / 600 / white/75 | Tracking: wide
```

### SECTION 3: Filter Bar

Height: ~72px | BG: white / dark: gray-900 | Padding: py-6

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  [All*] [ATS-Friendly] [Single Column] [Two Column] [Fresher] [Experienced] [Any Role] [Campus] [Professional] [Academic] │
└─────────────────────────────────────────────────────┘
Layout system: Flex wrap, gap-2, max-w-5xl mx-auto
```

**TYPOGRAPHY + CONTENT MAP:**

```
  filter pill (active) → "All" | Style: Label 12px / 500 | BG: emerald-600 text-white border-emerald-600 | Shape: rounded-full px-3 py-1
  filter pill (inactive) → others | Style: Label 12px / 500 | BG: white text-gray-600 border-gray-200 → hover: border-emerald-400 text-emerald-600 | Dark: bg-gray-800 text-gray-300 border-gray-700
```

Logic: `const c = ["All","ATS-Friendly","Single Column","Two Column","Fresher","Experienced","Any Role","Campus","Professional","Academic"]`; `o.x.filter(t => t.tags.includes(e))` when not "All". Clicking a tag inside a card also sets filter (`onClick: () => t(a)`).

### SECTION 4: Premium Upsell Banner

Height: ~88px | BG: gradient from-emerald-700 to-green-800 | Padding: px-6 py-5 | Radius: 16px

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  [Rocket icon 40px white/15]  "Premium Resume Templates - 8+ Doc-Based Templates" →  "Get Templates →" [white pill] │
│                               "8+ professionally designed, ATS-friendly..." (emerald-200 12px)                     │
└─────────────────────────────────────────────────────┘
Layout system: Flex row (col on mobile), gap-4, items-center, max-w-5xl mx-auto
```

**TYPOGRAPHY + CONTENT MAP:**

```
  icon → Rocket lucide, 20px white, container 40×40 bg-white/15 rounded-xl
  title → "Premium Resume Templates - 8+ Doc-Based Templates" | Style: Body 14–16px / 900 (font-black) / white
  sub → "8+ professionally designed, ATS-friendly Word & Google Doc resume templates - instant access via Google Drive." | Style: Small 12px / emerald-200
  CTA → "Get Templates →" | Style: Label 12px / 900 | BG: white text-emerald-700 px-4 py-2 rounded-xl → hover: bg-emerald-50
```

Link: `https://topmate.io/letscode/2128688` (external, target _blank).

### SECTION 5: Template Grid (core)

Height: auto (~1100px for 6 cards) | BG: gray-50 page bg outside, cards white | Padding: pb-16

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ preview     │  │ preview     │  │ preview     │  │
│  │ h-72 gray100│  │ h-72        │  │ h-72        │  │
│  │ zoom 0.163  │  │             │  │             │  │
│  │ [hover pill]│  │             │  │             │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  │
│  │ h3 + desc   │  │             │  │             │  │
│  │ tags row    │  │             │  │             │  │
│  │ [Use Btn]   │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ ... row 2   │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
Layout system: CSS Grid, sm:grid-cols-2 lg:grid-cols-3, gap-8, max-w-5xl mx-auto px-4 sm:px-6 lg:px-8
```

**TYPOGRAPHY + CONTENT MAP (per card):**

```
  preview → 72px tall (h-72) bg-gray-100 dark:bg-gray-700 overflow-hidden, contains zoomed resume at 0.163 scale (pointer-events none). Bottom 48px white gradient fade. Hover: dark overlay bg-black/10 + centered pill "Click to edit" (white/90, 12px/600, px-3 py-1.5 rounded-full, shadow, opacity 0→100)
  h3 → template name e.g. "Classic" / "Executive" / "Clean" / "Campus" / "Sigma" / "Harvard" | Style: Body 16px / 700 / gray-900 dark:white
  desc → e.g. "Traditional Times New Roman single-column format. Widely used in India..." | Style: Small 12px / 400 / gray-500 dark:gray-400, leading-relaxed, flex-1
  tag pill → e.g. "ATS-Friendly" | Style: 11px / 500 | BG: gray-100 (inactive) → active when filter equals tag: bg-emerald-100 text-emerald-700 ; hover: bg-emerald-50 text-emerald-600 (clickable to set filter)
  CTA → "Use This Template →" | Style: 14px / 600 | BG: gray-900 → hover gray-700 text-white w-full rounded-xl py-2.5 | Link: /resume-templates/{id}/edit
```

Exhaustive child enumeration (from chunk 3272 data, 6 templates — no orphans):

```
  CHILD[0] id:classic-ats name:Classic tags:[ATS-Friendly, Single Column, Fresher, Campus] accent:#111827
  CHILD[1] id:modern name:Executive tags:[Two Column, Experienced, Product, Senior] accent:#374151
  CHILD[2] id:minimal name:Clean tags:[Minimal, Any Role, Any Level, ATS-Friendly] accent:#1f2937
  CHILD[3] id:placement name:Campus tags:[ATS-Friendly, Single Column, Fresher, Campus, India] accent:#1e3a5f
  CHILD[4] id:sigma name:Sigma tags:[Two Column, Experienced, Academic, Any Role] accent:#555555
  CHILD[5] id:harvard name:Harvard tags:[ATS-Friendly, Single Column, Experienced, Professional] accent:#1a1a1a
  No orphan classes — all children share class "bg-white dark:bg-gray-800 rounded-2xl border ..."
  Each card H: ~420px (preview 288px + body ~132px)
```

### SECTION 6: "Already have a resume?" CTA

Height: ~160px | BG: white card, border gray-200, rounded-2xl | Padding: p-6, max-w-5xl

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  "Already have a resume?"  [Analyse My Resume →]   │
│  "Run it through our free ATS analyser..."          │
└─────────────────────────────────────────────────────┘
Layout: centered flex col, gap-3
```

**TYPOGRAPHY + CONTENT MAP:**

```
  h2 → "Already have a resume?" | Style: 600 / 18px / gray-900
  sub → "Run it through our free ATS analyser to see how recruiters see it." | Style: 14px / gray-500
  CTA → "Analyse My Resume" | BG: gray-900 → hover gray-700, text-white, rounded-xl
```

Link: `/dashboard/optimizeresume/`

### SECTION 7: "8 Free AI Career Tools"

Height: ~180px | BG: gray-50 | Padding: py-8

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  "8 Free AI Career Tools"   "Mock tests, resume scan, job finder, cover letter & more"  [Open AI Toolkit →] │
└─────────────────────────────────────────────────────┘
```

**TYPOGRAPHY + CONTENT MAP:**

```
  h2 → "8 Free AI Career Tools" | Style: 700
  CTA → "Open AI Toolkit" | Link: /dashboard/
```

### SECTION 8: Footer

Height: ~480px | BG: white (light) | Padding: py-12, max-w-7xl

**INTERNAL ASCII WIREFRAME:**

```
┌─────────────────────────────────────────────────────┐
│  [Logo + tagline + social icons 6] [Stay updated email input] + 4-col link grid                │
│  Col1: Learning (8 links) | Col2: AI Tools (7 links) | Col3: Community (5) | Col4: Support (7) │
│  Popular chips row: [DSA Roadmap] [Mock Interview] [AI Job Finder] [Cover Letter] [Startup Jobs]│
└─────────────────────────────────────────────────────┘
Layout system: Grid 4-col desktop, 2-col mobile, gap-8
```

**TYPOGRAPHY + CONTENT MAP:**

```
  brand → "Let's Code" tagline: "AI-powered career tools, 1000+ free resources, and a community of 1 lakh+ engineers" | Style: 14px / gray-600
  heading → "Learning" etc | Style: Label 12px / 600 uppercase tracking-wide / gray-900
  link → e.g. "BTech Engineering Kit" | Style: 14px / 400 / gray-600 → hover: emerald-600
  social icon → 20px gray-400 → hover: gray-600, links to whatsapp/telegram/linkedin/youtube/instagram/discord
```

### SECTION 9: Bottom Bar

Height: 56px | BG: white + border-t gray-200 | Padding: py-4

```
  text → "© 2026 Let's Code · Made with ❤️ for developers · Sitemap" | Style: 12px / gray-500 centered
```

---

## 1.3b — COMPOSITION MAPS

### COMPOSITION MAP: Hero — Fanned Mini Resume Previews

Element count: 3 distinct visual objects + 1 ambient (no Lottie/canvas — pure DOM with CSS transform). This IS the hero's signature composition.

```
CENTER:    None — composition is a row of 3 equal mini cards, not a single hero device
           Arrangement: flex row, gap-4 (16px), items-end, justify-center, pt-6
           Each mini: 110×150px white card, rounded-xl (12px), shadow-2xl, ring-1 ring-white/20, overflow-hidden

BEHIND/ROW:  3 cards fanned with rotation + vertical offset (the drama):
            Per-element:
              - Card 1 (Classic): rotate -5deg, translateY 10px, label "Classic" 11px/600 white/75 below
              - Card 2 (Campus):  rotate 0deg,  translateY -10px (pops up 20px above siblings), label "Campus"
              - Card 3 (Executive): rotate +5deg, translateY 10px, label "Executive"
            Inside each: resume rendered at zoom 0.163 (scale 16.3%), pointerEvents none, userSelect none, actual template component (Classic uses s.Z, Modern uses n.Z, etc. fed data l.S). Bottom 48px gradient fade: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))

FLANKING:  none

ABOVE:     none — no badge overlays on the minis themselves

AMBIENT:   Dark hero bg (gray-900) provides contrast. No explicit glow element in DOM — the fanned cards' shadow-2xl + ring-white/20 creates subtle depth against the dark bg. The page's overall dark hero is the ambient.
```

Anti-flattening check: If you rebuild as "3 resume thumbnails in a row" without the -5/0/+5 deg rotations and the -10 vs +10 translateY offset, you lose the fanned, playful editorial feel that distinguishes this hero from a generic grid. The center card MUST sit 20px higher (translateY -10 vs +10) and be untilted; the outers MUST tilt outward. Zoom must be 0.163 — larger zoom crops content, smaller makes text illegible even as texture.

---

## 1.4 — ANIMATION TIMELINES

No JS animation library drives entrance — all motion is CSS transition on hover/filter. Page load is static (no fade-up stagger observed in JS). Documented as such intentionally.

```
ANIMATION: Card hover lift
Section: Template Grid (Section 5)
Trigger: hover (CSS :hover)
Library: CSS transition-all duration-200
TIMELINE:
  t=0ms    card   FROM: transform: translateY(0), box-shadow: shadow-sm (0 1px 2px rgba(0,0,0,0.05)), overlay opacity 0
  t=0→200ms card  TO:   transform: translateY(-4px), box-shadow: shadow-xl, overlay bg rgba(0,0,0,0.10), pill opacity 0→1
  DURATION: 200ms  EASING: ease (Tailwind default) — quick, functional, not springy
PROPERTIES ANIMATED: transform, box-shadow, background-color (overlay), opacity (pill)
LOOP: no
RESET: on mouse leave reverses 200ms

ANIMATION: Filter pill active switch
Section: Filter Bar (Section 3)
Trigger: click (React useState re-render)
Library: CSS transition-colors duration-150 (inferred from Tailwind transition-colors)
TIMELINE:
  t=0ms    pill   FROM: bg white, text gray-600, border gray-200
  t=0→150ms pill  TO:   bg emerald-600, text white, border emerald-600
  DURATION: 150ms  EASING: ease
PROPERTIES ANIMATED: background-color, color, border-color
LOOP: no

ANIMATION: Tag pill hover inside card
Section: Template Grid
Trigger: hover
TIMELINE: bg gray-100 → emerald-50, text gray-600 → emerald-600 over 150ms
  (identical mechanism to filter pills but lighter)

ANIMATION: Banner CTA hover
Section: Premium Banner
Trigger: hover on parent .group
TIMELINE: CTA bg white → emerald-50, banner gradient emerald-700→800 to emerald-800→900 over 200ms

ANIMATION: Preview image load
Section: Template Grid
Trigger: auto after JS lazy load (LoadableComponent fallback is h-full bg-gray-100 animate-pulse)
TIMELINE: pulse (animate-pulse = opacity 1 → 0.5 → 1 over 2s cubic-bezier(0.4,0,0.6,1) infinite) until template component mounts, then instant swap to rendered resume (no fade)
```

Opaque media: No Lottie/canvas/SVG hero animation — hero minis are DOM-rendered resume components at 0.163 zoom. No decomposition needed beyond 1.3b.

---

## 1.5 — MICRO-INTERACTIONS

```
INTERACTION: Filter pill
Selector hint: .flex.flex-wrap.gap-2 > button (Filter Bar + card tag buttons reuse same pattern)
STATE         | background              | color              | transform | box-shadow | other
─────────────────────────────────────────────────────────────────────────────────────────────────
DEFAULT       | #FFFFFF (white)         | #4B5563 (gray-600) | scale(1)  | none       | border 1px solid #E5E7EB, rounded-full
HOVER         | #FFFFFF                 | #059669 (emerald-600) | scale(1)  | none    | border emerald-400
ACTIVE/CLICK  | #059669 (emerald-600)   | #FFFFFF            | scale(0.97) | none     | border emerald-600 (selected state persists)
FOCUS         | –                       | –                  | –         | 0 0 0 3px rgba(16,185,129,0.3) | outline via --ring
MECHANISM: CSS transition-colors (background-color, color, border-color 150ms ease). No pseudo-element slide — flat color swap.
DURATION: 150ms  EASING: ease
⚑ SPECIAL BEHAVIOR: Filter is NOT a CSS-only toggle. Click runs React setState `t(a)` which re-filters `o.x.filter(t => t.tags.includes(e))` and re-renders the grid. The pill's visual active state is derived from `e===a` comparison, not :active. Card tag pills share the same handler — clicking a tag inside a card sets the global filter (cross-component state).

INTERACTION: Template card
Selector hint: .bg-white.rounded-2xl.border.shadow-sm (Template Grid)
STATE         | background | color | transform        | box-shadow | other
─────────────────────────────────────────────────────────────────────────
DEFAULT       | #FFFFFF    | –      | translateY(0)   | shadow-sm (0 1px 2px rgba(0,0,0,0.05)) | border gray-200
HOVER         | #FFFFFF    | –      | translateY(-4px)| shadow-xl (0 20px 25px -5px rgba(0,0,0,0.10)) | overlay fade in, pill fade in
ACTIVE/CLICK  | –          | –      | scale(0.99)     | –         | navigates to /resume-templates/{id}/edit
FOCUS         | –          | –      | –               | ring 2px emerald-500 | –
MECHANISM: CSS transition-all duration-200 ease (transform + box-shadow + background-color of overlay).
⚑ SPECIAL BEHAVIOR: Hover overlay is `absolute inset-0 bg-black/0 → bg-black/10` + centered pill `opacity 0→100` with `transition-opacity duration-200`. The lift is `hover:-translate-y-1` (Tailwind -4px) combined with shadow swap. The preview inside is `pointer-events: none` so the card link captures the click, not the zoomed resume.

INTERACTION: Banner CTA ("Get Templates")
Selector hint: .bg-white.text-emerald-700.rounded-xl (Premium Banner)
STATE         | background | color   | transform | box-shadow
──────────────────────────────────────────────────────────────
DEFAULT       | #FFFFFF    | #047857 | scale(1)   | none
HOVER (group) | #ECFDF5 (emerald-50) | #047857 | scale(1) | none
ACTIVE        | #D1FAE5    | #047857 | scale(0.97) | none
MECHANISM: Tailwind group-hover (parent is .group). Transition-colors 200ms.
⚑ SPECIAL BEHAVIOR: Hover is triggered by hovering ANYWHERE on the banner (group-hover), not just the button — entire banner is an <a> so the CTA brightens as you approach it.

INTERACTION: "Use This Template" button
Selector hint: .bg-gray-900.hover\:bg-gray-700 (inside card)
STATE         | background | color  | transform
────────────────────────────────────────────────
DEFAULT       | #111827    | white  | scale(1)
HOVER         | #374151    | white  | scale(1)
ACTIVE        | #1F2937    | white  | scale(0.97)
MECHANISM: transition-colors 200ms
```

---

## 1.6 — STATE MACHINES

```
STATE MACHINE: Filter-controlled template grid
Location: Section 3 + Section 5 (Filter Bar drives Grid)
Type: Cycler (filter selection, not timed)
STATES:
  State A: filter = "All" → grid shows all 6 cards (classic-ats, modern, minimal, placement, sigma, harvard)
  State B: filter = "<tag>" (e.g. "Two Column") → grid shows subset where tags includes selected tag (e.g. modern + sigma)
  State C: filter = tag with 0 matches → grid shows empty state: centered text "No templates match this filter yet. More coming soon!" (py-16, 14px gray-400)
INITIAL STATE: State A ("All")
TRANSITION A→B:
  Trigger: click on filter pill or card tag pill (`onClick: () => t(a)`)
  Element 1: outgoing cards animate out via React re-render (no exit animation — instant DOM removal)
  Element 2: incoming cards appear instantly (no entrance animation)
  Element 3: pill active state swaps (bg/color transition 150ms, see 1.5)
  Data logic: `a = "All" === e ? o.x : o.x.filter(t => t.tags.includes(e))` — simple array filter on `tags` field
TRANSITION B→A / B→B (change filter):
  Same as A→B — instant grid swap, pill transition 150ms
LOOP: user-controlled, infinite
INTERNAL LAYOUT:
  Container: max-w-5xl mx-auto, grid sm:grid-cols-2 lg:grid-cols-3 gap-8
  Empty state: text-center py-16 text-sm gray-400
  Each card: flex flex-col, rounded-2xl, overflow-hidden, flex-1 for description to push CTA to bottom

STATE MACHINE: Lazy preview loader
Location: Section 5 preview area
Type: Promise-based loader
STATES:
  State A: Loading → div.h-full.bg-gray-100.animate-pulse (pulsing gray placeholder, 2s infinite)
  State B: Loaded → <i template=... /> (resume component at zoom 0.163)
INITIAL STATE: State A
TRANSITION A→B:
  Trigger: Promise.all([import 7651, import 4728]).then(load 94728) resolves (see page chunk: LoadableComponent with ssr:false)
  Element: placeholder replaced by rendered resume (no crossfade — hard swap)
LOOP: once per card, not cyclic
```

---

## 1.7 — SCROLL CHOREOGRAPHY MAP

```
Scroll %  │ Viewport Position         │ Event / Animation Trigger
─────────────────────────────────────────────────────────────────────
0%        │ Page load (top)           │ Hero static (no entrance animation); nav visible
~5%       │ Filter bar enters vh      │ No trigger — static pill row
~15%      │ Banner enters vh          │ No trigger — static gradient
~20%      │ First grid row enters     │ No scroll-triggered animation (cards are static; only hover lifts)
~100%     │ Footer enters             │ No trigger
─────────────────────────────────────────────────────────────────────
SCROLL BEHAVIORS:
  Parallax elements: none — no parallax multipliers detected in JS/CSS
  Sticky elements: Global nav is sticky (position:sticky top-0, z-index high). No sticky within content sections.
  Nav state change: No scroll-threshold color change (nav stays white throughout). Hero is dark, but nav does NOT invert on hero — nav sits above hero with white bg, hero is below it (not full-bleed behind nav).
```

Note: This site has NO scroll-driven choreography (no GSAP ScrollTrigger, no Lenis, no pinning, no stacking). Motion is entirely hover-driven micro-interactions + instant filter swaps. This is load-bearing for the clone: do NOT add scroll reveals, parallax, or stacking where the reference has none — that would be invention, not replication.

---

## 1.8 — TECHNICAL STACK

```
  Framework: Next.js 15+ App Router (app/(non-dashboard)/resume-templates/page-...js) — confidence: high (chunk naming, _next/static, dynamic import pattern)
  Animation: CSS transitions only (Tailwind transition-all / transition-colors duration-150–200) — confidence: high (no GSAP/Framer/Lottie imports found)
  Scroll:    native (no Lenis / Locomotive / ScrollTrigger) — confidence: high
  UI Lib:    Tailwind CSS 3.4.17 + shadcn/ui (CSS vars --background/--foreground/--primary etc, :root + .dark) — confidence: high
  Icons:     lucide-react (Rocket, ArrowRight via a(79205).Z("Rocket") / a(76858).Z for arrow) — confidence: high
  Fonts:     Geist Sans + Geist Mono (next/font, woff preload 4473ecc91f70f139 / 463dafcda517f24f) — confidence: high
  Other:     Next.js dynamic() with ssr:false for preview (LoadableComponent), jsPDF for PDF export (referenced in AI Resume Studio), MongoDB, Claude API (from site's AI tools description) — not on this page but globally
```

Detection method: `_next/static` chunk inspection + CSS class patterns (`flex`, `grid`, `rounded-2xl`, `gap-8` etc) + `getComputedStyle` via CSS file + JS chunk content (webpackChunk_N_E, a(57437) = jsx runtime, a(2265) = React).

---

## 1.9 — MOTION PHILOSOPHY + COPY VOICE

```
MOTION PHILOSOPHY:
Functional, fast, and deliberately restrained. Every animation is a 150–200ms ease color/transform swap that confirms an action without performing. There is no entrance choreography, no scroll storytelling, no spring. The fanned hero minis are static — their "motion" is implied by the -5/0/+5 deg rotation and the center card's -10px lift, creating a frozen fan like cards dealt on a table. Card hover is a 4px lift + shadow swap that says "pick me" in 200ms and then stops. Filter changes are instant content swaps with only the pill's color transition to mark the event. What would be lost without motion: the lift and overlay are the only affordance that these cards are clickable — without them the grid would read as static thumbnails. Everything else is honest stillness; adding motion would make the page feel like a marketing site, not a tool.

COPY VOICE PATTERN:
  Tone:          Clinical + helpful + India-campus-aware. Direct, no hype. "ATS-optimised templates for software engineers, data scientists, and freshers. Edit online and download as PDF — free." is the thesis — audience, benefit, action, price in one sentence.
  Sentence form: Short declarative sentences. Headlines are 4–6 words ("Resume Templates That Get You Hired", "Already have a resume?"). Descriptions are 1–2 sentences, plain nouns, no adjectives stacking. E.g. "Traditional Times New Roman single-column format. Widely used in India for campus placements, service companies (TCS, Infosys, Wipro), and MNC applications."
  Key device:    Specificity over superlatives. Names companies (TCS, Infosys, Wipro), roles (Fresher, Campus, Senior), formats (Single Column, Two Column), and outcomes (ATS-Friendly) as tags — the taxonomy IS the copy. Contrasts are practical, not poetic: "Great for experienced professionals applying to product companies and senior roles" vs "Works for any role, any level, any company."
  Example pattern: "[Format] + [audience] + [where it works]." — "Two-column document style with a clean gray sidebar. Great for experienced professionals applying to product companies and senior roles."
```

---

## Audit completeness checklist

- [x] 1.1 Page architecture (9 sections, ASCII wireframe, overlapping note)
- [x] 1.2 Design tokens (palette with hex + HSL + usage, typography scale with drama notes, spacing/radius/shadow)
- [x] 1.3 Section blueprints (all 9 sections, internal wireframes, content maps, exhaustive child enumeration for grid — 6 cards, no orphans)
- [x] 1.3b Composition map (hero fanned minis — 3 objects, per-element rotation/translate/zoom/gradient)
- [x] 1.4 Animation timelines (4 timelines with t=Xms, FROM→TO, duration, easing, mechanism)
- [x] 1.5 Micro-interactions (4 diff tables with DEFAULT/HOVER/ACTIVE/FOCUS + mechanism + special behavior)
- [x] 1.6 State machines (filter grid + lazy loader)
- [x] 1.7 Scroll choreography (explicit "no scroll choreography" — load-bearing for clone fidelity)
- [x] 1.8 Technical stack (framework + animation + scroll + UI lib + icons + fonts, with confidence + detection method)
- [x] 1.9 Motion philosophy + copy voice (gestalt + tone/form/device/example)
