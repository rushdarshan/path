# Replication Prompt — Pathlight Resume Panel (lets-code.co.in Resume-Templates Clone → Existing Project Improvement)

---

## 1. ROLE + AESTHETIC IDENTITY

**Role:** Act as a World-Class Senior Creative Technologist and Lead Frontend Engineer.

**Aesthetic Identity:** Minimal Precision / Trustworthy Tool — Clinical Ink, Quiet Emerald

You are not building a marketing page. You are upgrading an *in-app* tool panel (#panel-resume) inside an existing zero-dependency vanilla SPA (Pathlight — Personalized Learning Path Recommender). The reference you are transplanting is https://www.lets-code.co.in/resume-templates/ — a clinical, ATS-obsessed, India-campus-aware template gallery built in Next.js + Tailwind + Geist Sans. Its soul is restraint: white cards, ink typography, a single emerald accent, and a playful fanned-hero that proves craft without shouting. Your job is to graft that soul onto Pathlight's data model (gapReport, weeklyPlan, audit trail) without inventing motion that the reference doesn't have.

---

## 2. CORE DESIGN SYSTEM

### Palette

| Semantic Name | Descriptive Word | Hex | Usage |
|---|---|---|---|
| Ink | Charcoal Ink | #111827 (also #09090B / hsl 240 10% 3.9% --foreground) | Primary text, CTA bg ("Use This Template" / "Analyze resume"), card titles, accent for Classic template #111827, Harvard #1a1a1a |
| Background | Paper White | #FFFFFF (hsl 0 0% 100% --background) | Page + card bg (dark: #1F2937 gray-800) |
| Page Wash | Soft Mist | #F9FAFB (gray-50) | Outside grid wash (keep existing Pathlight page bg) |
| Border | Whisper Line | #E4E4E7 (hsl 240 5.9% 90% --border) | Card borders, dividers, filter pill border |
| Muted | Quiet Stone | #71717A (hsl 240 3.8% 46.1% muted-foreground) / #6B7280 gray-500 / #9CA3AF gray-400 | Secondary text, descriptions, empty-state text |
| Emerald Primary | Focus Emerald | #059669 (emerald-600) | Active filter pill bg + border, hover border/text, tag active bg emerald-100 (#D1FAE5) text #065F46, ring focus |
| Emerald Deep | Authority Emerald | #047857 (emerald-700) | Banner gradient FROM, CTA hover, heading accents |
| Banner Gradient | Deep Forest | from #047857 to #166534 (green-800) | Premium/Pro banner bg (emerald-700 → green-800) |
| Overlay Hover | Veiled Ink | rgba(0,0,0,0.10) | Card preview hover overlay |
| Preview Fades | Paper Fade | linear-gradient(to bottom, transparent, rgba(255,255,255,0.95)) 48px | Bottom fade inside preview |
| Template Accents | Per-card inks | Classic #111827, Executive #374151, Clean #1f2937, Campus #1e3a5f, Sigma #555555, Harvard #1a1a1a | Preview gradient stops (e.g. Classic from-gray-700 to-gray-900) |

Dark mode mirrors via CSS vars: --background hsl(240 10% 9%), --foreground hsl(0 0% 98%), border hsl(240 3.7% 20%), card hsl(240 10% 12%).

**Substitution rule:** Reference Primary (Ink) → Ink #111827, Reference Accent (Emerald) → Emerald Primary #059669, Reference Background (White) → Paper White #FFFFFF, Reference Dark → Ink. Never reassign roles — if the reference used Ink for CTA bg, you use Ink #111827 for CTA bg.

### Typography

| Role | Font Family | Weight | Size | Line-Height | Notes |
|---|---|---|---|---|---|
| Display (Hero H1) | Geist Sans __geistSans_1e4310, system-ui fallback | 800 | clamp(2.2rem, 5vw, 3.0rem) | 1.05 | Tracking -0.02em, white on dark hero, tight leading is the drama. Must stay 800, not 700. |
| H3 Card Title | Geist Sans | 700 | 1.0rem (16px) | 1.4 | Tracking -0.01em, gray-900 dark:white |
| Body/Desc | Geist Sans | 400 | 0.875rem (14px) for sub, 0.75rem (12px) for card desc | 1.6 / 1.5 | gray-600/500, leading-relaxed on desc |
| Label/Pills | Geist Sans | 500 | 0.75rem (12px) / 11px on mini labels & tag pills | 1.4 | tracking 0.02em on pills; rounded-full 9999px |
| Mono/Meta | Geist Mono __geistMono_c3aa02 | 400 | 0.75rem | 1.5 | Session ID, code-like meta |

**⚑ Drama Ratio:** The hero's drama is *not* a giant serif italic* — it is weight contrast 800 (Display H1 at 2.2–3rem, -0.02em) vs 400 (14–12px Body) plus color contrast (white headline on near-black #111827/gray-900) paired with the fanned 3-mini-card composition to its right. Tight tracking + tall x-height of Geist Sans at display size, offset by the -5/0/+5 deg fanned minis with center card 20px higher, IS the composition's tension. Do not drop weight to 700, do not relax tracking to 0, do not flatten the fan to a straight grid — if you do, the hero becomes a generic marketing header and the tool loses its craft signal. Preserve exactly: Display 800 / -0.02em / 1.05 + mini rotations -5deg / 0deg / +5deg and translateY +10 / -10 / +10.

### Texture System

- Noise/grain: none — flat colors + gradients only. Do not add grain.
- Border radius scale: card/banner 16px (rounded-2xl), mini preview 12px (rounded-xl), filter pills 9999px (rounded-full), CTA button 12px (rounded-xl).
- Shadow system: default card `0 1px 2px rgba(0,0,0,0.05)` (shadow-sm) + 1px border #E4E4E7; hover `0 20px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.04)` (shadow-xl) + translateY(-4px). Mini hero cards: shadow-2xl + ring-1 ring-white/20. Banner: no shadow, gradient only.

---

## 3. COMPONENT ARCHITECTURE

> High-Fidelity rule: ASCII wireframes, animation timelines (t=Xms), property diff tables, and state machines below are *transplanted* from Site DNA (plans/01-site-dna.md) with PATHLIGHT content substituted. Do not paraphrase them into prose.

### SECTION 1 — Global Nav — "The Quiet Ledger" (KEEP existing Pathlight topbar, do NOT clone marketing nav)

Reference Global Nav is **REMOVED** per brand interview. Keep Pathlight's existing `.topbar`:
```
┌─────────────────────────────────────────────────────┐
│  [◎ Pathlight  "personal learning paths"]  [Converse][Profile][Path][Why][Mastery][Resume*]   [Session — code] │
└─────────────────────────────────────────────────────┘
Layout: flex row justify-between, tabs are .tab buttons (active = underline/bold), not pill nav. Session code on right.
```
No change to nav — this preserves the app shell. The reference's marketing nav (Learn / PYQ's / Interview ...) is **not** transplanted.

### SECTION 2 — Hero — "The Dealt Hand" (ADAPT — keep fanned composition, swap content to gap-aware)

**Embedded ASCII wireframe (transplanted, content substituted):**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────┐  │
│  │ LEFT 60%                 │  │ RIGHT 40%        │  │
│  │ h1: "Resume Templates     │  │ 3 fanned mini    │  │
│  │  That Get You Hired —    │  │ cards (110×150)  │  │
│  │  Powered by Your Gaps"   │  │ -5deg / 0 / +5deg│  │
│  │ sub: "Paste your resume  │  │ labels: Classic  │  │
│  │ once. Pathlight maps...  │  │ Campus / Executive│ │
│  │ [4 badges: Gap-Aware     │  │ (center pops +20px)│
│  │  Prerequisite-Ordered     │  │                  │  │
│  │  Weekly Plan  Audit Trail]│  │                  │  │
│  └──────────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
Layout system: Flex row (column on mobile), gap-8, items-center, max-w-5xl mx-auto px-4 sm:px-6 lg:px-8, BG gray-900 → near-black (#111827), py-12 lg:py-16. This hero lives *inside* #panel-resume as its header, not as a full page hero.
Gap: 32px between columns
```

**Typography + Content Map (adapted):**
```
  h1 → "Resume Templates That Get You Hired — Powered by Your Actual Gaps" | Style: Display 800 / clamp 2.2–3rem / white / -0.02em / 1.05
  sub → "Paste your resume once. Pathlight maps what you already cover against a prerequisite graph and shows you the smallest set of templates and topics that close real gaps — ATS-optimised, PDF-ready, and tied to your weekly plan." | Style: Body 16px/400 / gray-300
  badge → "Gap-Aware" / "Prerequisite-Ordered" / "Weekly Plan" / "Audit Trail" | Style: Label 11px/600 / emerald-200 chip on dark (bg white/10 rounded-full px-2 py-1)
  mini label → "Classic" / "Campus" / "Executive" | Style: Label 11px/600 / white/75 tracking-wide
```

**Embedded Composition Map (transplanted verbatim, content mapped):**
```
COMPOSITION MAP: Hero — Fanned Mini Resume Previews — "The Dealt Hand"
Element count: 3 distinct visual objects + ambient (DOM + CSS transform, no Lottie)

CENTER:    None — row of 3 equal mini cards (NOT a single device)
           Arrangement: flex row gap-4, items-end, justify-center, pt-6
           Each mini: 110×150px white card, rounded-xl 12px, shadow-2xl, ring-1 ring-white/20, overflow-hidden

BEHIND/ROW: 3 cards fanned with rotation + vertical offset (THE drama):
            Per-element:
              - Card 1 (Classic — Classic #111827): rotate -5deg, translateY 10px, label "Classic" 11px/600 white/75 below
              - Card 2 (Campus — Campus #1e3a5f): rotate 0deg, translateY -10px (pops 20px above siblings), label "Campus"
              - Card 3 (Executive — Executive #374151): rotate +5deg, translateY 10px, label "Executive"
            Inside each: resume component rendered at zoom 0.163 (transform: scale(0.163), transform-origin top left, width 673px ≈ 110/0.163), pointer-events none, user-select none. For Pathlight, render either real template component (Classic/Campus/Executive fed dummy data like existing l.S) OR a minimal static thumbnail with gray lines mimicking resume sections — must keep zoom 0.163. Bottom 48px gradient: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95)), pointer-events none, absolute inset bottom.

FLANKING:  none
ABOVE:     none
AMBIENT:   Dark hero bg #111827 (gray-900) — provides contrast. Depth comes from shadow-2xl + ring-white/20 on minis, not an extra glow element.
```

Anti-flattening enforcement: Rebuild as "3 resume thumbnails in a row" but MISS the -5/0/+5 rotations and the -10 vs +10 lift and you have flattened the hero's signature. The center card MUST sit 20px higher; the outers MUST tilt outward. Zoom MUST be 0.163.

### SECTION 3 — Filter Bar — "The Quiet Filter" (KEEP AS-IS)

**Embedded wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  [All*] [ATS-Friendly] [Single Column] [Two Column] [Fresher] [Experienced] [Any Role] [Campus] [Professional] [Academic] │
└─────────────────────────────────────────────────────┘
Layout: Flex wrap gap-2, max-w-5xl mx-auto px-4 sm:px-6 lg:px-8, py-6, BG white (dark: gray-900)
```

**Embedded property diff table (transplanted, hex mapped to Palette above):**
```
INTERACTION: Filter pill — "The Quiet Filter"
Selector: #panel-resume .filter-bar > button  (also card tag pills reuse same handler)
STATE         | background              | color              | transform | box-shadow | other
─────────────────────────────────────────────────────────────────────────────────────────────────
DEFAULT       | #FFFFFF                 | #4B5563 (gray-600) | scale(1)  | none       | border 1px solid #E4E4E7 (Whisper Line), rounded-full px-3 py-1
HOVER         | #FFFFFF                 | #059669 (Emerald Primary) | scale(1)  | none    | border #34D399 (emerald-400)
ACTIVE/CLICK  | #059669                 | #FFFFFF            | scale(0.97) | none     | border #059669 (selected persists)
FOCUS         | –                       | –                  | –         | 0 0 0 3px rgba(16,185,129,0.3) | outline via --ring
MECHANISM: CSS transition-colors 150ms cubic-bezier(0.4, 0, 0.2, 1) (background-color, color, border-color). No pseudo-element slide.
DURATION: 150ms  EASING: cubic-bezier(0.25, 0.1, 0.25, 1) /* ease */
⚑ SPECIAL: Click runs JS setState that re-filters array via `filtered = selected==="All" ? all : all.filter(t => t.tags.includes(selected))` and re-renders grid. Active state derived from `selected===tag` equality, not :active. Card tag pills share same handler — clicking a tag inside a card sets the global filter (cross-component state).
```

**Embedded animation timeline:**
```
ANIMATION: Filter pill active switch
Section: Filter Bar
Trigger: click (JS useState / vanilla selected var)
Library: CSS transition-colors
TIMELINE:
  t=0ms    pill  FROM: bg #FFFFFF, text #4B5563, border #E4E4E7
  t=0→150ms pill TO:   bg #059669, text #FFFFFF, border #059669
  DURATION: 150ms  EASING: cubic-bezier(0.25, 0.1, 0.25, 1) /* ease */
PROPERTIES: background-color, color, border-color
LOOP: no  RESET: on next click swaps back 150ms
```

Tags list is canonical: `["All","ATS-Friendly","Single Column","Two Column","Fresher","Experienced","Any Role","Campus","Professional","Academic"]`. Keep exactly this set — it maps to template tags in data chunk.

### SECTION 4 — Promo/Pro Banner — "The Emerald Threshold" (ADAPT)

**Embedded wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  [Rocket 40px white/15 rounded-xl]  "Unlock Pathlight Pro — Weekly plan, audit trail, and PDF export"  [View Pro →] │
│                                      "Your gaps, prerequisites, and schedule — all in one place." 12px emerald-200      │
└─────────────────────────────────────────────────────┘
Layout: Flex row (col on mobile) gap-4 items-center, max-w-5xl mx-auto, BG gradient from #047857 to #166534 (Emerald Deep → Deep Forest), rounded-2xl 16px, px-6 py-5, transition-all 200ms on hover. Entire banner is an <a> or click target with class .group.
```

**Content adaptation (copy voice preserved — clinical + helpful):**
```
  icon → Rocket lucide 20px white inside 40×40 bg-white/15 rounded-xl
  title → "Unlock Pathlight Pro — Weekly plan, audit trail, and PDF export" | Style: 14–16px / 900 (font-black) / white
  sub → "Your gaps, prerequisites, and schedule — all in one place." | Style: 12px / #A7F3D0 (emerald-200)
  CTA → "View Pro →" | Style: 12px / 900 | BG white text #047857 px-4 py-2 rounded-xl → hover bg #ECFDF5 (emerald-50)
```
Link is internal (to #panel-path or #panel-mastery), not external Topmate. Keep `group-hover` so hovering anywhere on banner brightens CTA.

### SECTION 5 — Template / Gap Card Grid — "The Evidence Grid" (KEEP AS-IS — core, now gap-aware)

**Embedded wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ preview     │  │ preview     │  │ preview     │  │
│  │ h-72 gray100│  │ h-72        │  │ h-72        │  │
│  │ zoom 0.163  │  │ zoom 0.163  │  │ zoom 0.163  │  │
│  │ [hover: pill "Click to view gap"] │          │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  │
│  │ h3 Classic  │  │ h3 Executive│  │ h3 Clean    │  │
│  │ desc 12px   │  │ desc        │  │ desc        │  │
│  │ [tags row]  │  │             │  │             │  │
│  │ [View gap + week →] gray-900 │  │            │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ row 2 ...   │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
Layout: CSS Grid sm:grid-cols-2 lg:grid-cols-3 gap-8, max-w-5xl mx-auto px-4 sm:px-6 lg:px-8, pb-16. Cards: bg-white dark:gray-800 rounded-2xl 16px border 1px solid #E4E4E7 shadow-sm → hover shadow-xl + -translate-y-1 (4px) transition-all 200ms cubic-bezier(0.25, 0.1, 0.25, 1), flex flex-col overflow-hidden, dark:border-gray-700.
```

**Per-card content map (transplanted, Pathlight data substituted):**
```
  preview → h-72 (288px) bg-gray-100 dark:gray-700 overflow-hidden relative, contains zoomed resume/card content at 0.163 scale, pointer-events none. Bottom 48px fade: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95)) absolute bottom-0 left-0 right-0 h-12. Hover: absolute inset-0 bg-black/0 → bg-black/10 + centered pill "Click to view gap" (bg-white/90 text-gray-900 12px/600 px-3 py-1.5 rounded-full shadow, opacity 0→100 transition-opacity 200ms)
  h3 → name: "Classic" / "Executive" / "Clean" / "Campus" / "Sigma" / "Harvard" (from chunk 3272 data) | Style: 16px / 700 / gray-900 dark:white
  desc → 1–2 sentences from chunk data, e.g. "Traditional Times New Roman single-column..." | Style: 12px/400 / gray-500 dark:gray-400 leading-relaxed flex-1
  tag pills → each tag e.g. "ATS-Friendly" | Style: 11px/500 rounded px-2 py-0.5 BG gray-100 dark:gray-700 text-gray-600 → active when filter===tag: bg #D1FAE5/#064E3B text #065F46/emerald-300 ; hover bg-emerald-50 dark:emerald-900/20 text-emerald-600 ; onClick sets global filter (same handler as filter bar)
  gap badge (ADDED, not in reference) → top-right of card header: `<span class="gap-badge">42% covered · gapLevel</span>` 11px/600 emerald-600 on gray-100 pill, derived from gapReport.topics[card.id] (pct + gapLevel). Must not disturb the reference layout — add as absolutely positioned or inline next to h3.
  CTA → "View gap + week →" (pathlight: replaces "Use This Template") | Style: 14px/600 w-full bg #111827 → hover #374151 text-white rounded-xl py-2.5 transition-colors, arrow icon 16px. Click scrolls to #gapDetails + highlights weeklyPlan week for that template's topics.
```

**Data mapping — use reference's 6 templates verbatim as the gallery (do not invent new templates):**
```js
// From 3272-6542fe0ef5e4b888.js — keep exactly these 6, no invention:
[
  {id:"classic-ats", name:"Classic",  desc:"Traditional Times New Roman single-column...", tags:["ATS-Friendly","Single Column","Fresher","Campus"], accent:"#111827", preview:"from-gray-700 to-gray-900"},
  {id:"modern",      name:"Executive",desc:"Two-column document style with a clean gray sidebar...", tags:["Two Column","Experienced","Product","Senior"], accent:"#374151", preview:"from-gray-500 to-gray-700"},
  {id:"minimal",     name:"Clean",    desc:"Google Docs / Calibri style...", tags:["Minimal","Any Role","Any Level","ATS-Friendly"], accent:"#1f2937", preview:"from-gray-400 to-gray-600"},
  {id:"placement",   name:"Campus",   desc:"Standard Indian engineering campus placement format...", tags:["ATS-Friendly","Single Column","Fresher","Campus","India"], accent:"#1e3a5f", preview:"from-blue-700 to-blue-900"},
  {id:"sigma",       name:"Sigma",    desc:"Two-column format for top-tier achievers...", tags:["Two Column","Experienced","Academic","Any Role"], accent:"#555555", preview:"from-zinc-400 to-zinc-600"},
  {id:"harvard",     name:"Harvard",  desc:"Classic Harvard/Garamond professional format...", tags:["ATS-Friendly","Single Column","Experienced","Professional"], accent:"#1a1a1a", preview:"from-stone-600 to-stone-900"},
]
```
Each card's preview gradient uses `preview` token (e.g. from-gray-700 to-gray-900) as a subtle bg behind the zoomed resume. Keep the zoom technique — do not replace with images.

**Embedded micro-interaction (transplanted):**
```
INTERACTION: Template card — "The Evidence Grid" lift
STATE         | background | color | transform        | box-shadow | other
─────────────────────────────────────────────────────────────────────────
DEFAULT       | #FFFFFF    | –      | translateY(0)   | shadow-sm 0 1px 2px rgba(0,0,0,0.05) | border 1px #E4E4E7 rounded-2xl overflow-hidden
HOVER         | #FFFFFF    | –      | translateY(-4px)| shadow-xl 0 20px 25px -5px rgba(0,0,0,0.10) | overlay bg-black/10 + pill opacity 0→1
ACTIVE/CLICK  | –          | –      | scale(0.99)     | –         | navigates/highlights gap details
FOCUS         | –          | –      | –               | ring 2px #059669 | –
MECHANISM: CSS transition-all duration-200 ease (transform + box-shadow + overlay bg + pill opacity).
⚑ SPECIAL: Hover overlay is absolute inset-0 bg-black/0 → bg-black/10 plus centered pill opacity 0→100 (transition-opacity 200ms). Lift is hover:-translate-y-1 (-4px). Preview inside is pointer-events:none so card link captures click.
```

**Embedded animation timeline:**
```
ANIMATION: Card hover lift
Section: Template Grid
Trigger: hover (CSS :hover)
Library: CSS transition-all
TIMELINE:
  t=0ms     card  FROM: translateY(0), shadow-sm, overlay bg rgba(0,0,0,0), pill opacity 0
  t=0→200ms card  TO:   translateY(-4px), shadow-xl, overlay bg rgba(0,0,0,0.10), pill opacity 1
  DURATION: 200ms  EASING: cubic-bezier(0.25, 0.1, 0.25, 1) /* ease */
PROPERTIES: transform, box-shadow, background-color, opacity
LOOP: no  RESET: on mouse leave reverse 200ms
```

**Empty state (from state machine):**
```
When filtered array length === 0: centered div text-center py-16 text-sm gray-400 dark:gray-500 → "No templates match this filter yet. More coming soon!"
```

### SECTION 6 — "Already Have a Resume?" Input Strip — "The Honest Inlet" (ADAPT — becomes functional textarea)

**Embedded wireframe (adapted from reference's centered card, now functional):**
```
┌─────────────────────────────────────────────────────┐
│  "Already have a resume?"  16px/600 gray-900       │
│  "Paste a resume or experience summary — we extract skills, feed them into your profile, and re-target the path around genuine gaps." 14px gray-500 │
│  ┌─────────────────────────────────────────────┐   │
│  │ textarea #resumeInput rows=10 placeholder    │   │
│  │ "Paste resume text here…" 14px gray-600     │   │
│  │ border 1px #E4E4E7 rounded-xl p-3 focus:ring emerald-500 │ 
│  └─────────────────────────────────────────────┘   │
│  [Analyze resume & refresh path]  bg #111827 → hover #374151 white 14px/600 rounded-xl py-2.5 px-4 │
│  #resumeResult: chips row for topicHits + gapSummary card (existing renderGapSummary)               │
└─────────────────────────────────────────────────────┘
Layout: max-w-5xl mx-auto px-4 sm:px-6 lg:px-8, BG white card border #E4E4E7 rounded-2xl p-6 flex col gap-3 (reference was a link CTA; now it's the form).
```
Keep the reference's card styling (border, shadow-sm, rounded-2xl, p-5–6) but replace the `<a href="/dashboard/optimizeresume">` with the real form. Existing JS `#resumeBtn` handler POSTs `{resume}` to `/api/session/:id`, then GETs session and sets `LAST_RESULT` — preserve that flow. Chip row uses existing `.chip` style: `<span class="chip"><b>topicId</b> · matched "evidence"</span>`.

### SECTION 7 — Gap Diagnosis Summary — "The Truth Bar" (ADDED — not in reference)

Not in reference — added per brand interview. Style as a card matching the grid's card language:
```
┌─────────────────────────────────────────────────────┐
│  "Gap diagnosis  42% of path covered by your background" 12px gray-500 │
│  "Summary sentence from g.summary" 14px gray-600    │
│  [ TopicA  [====----] 62%  "partial" ]              │
│  [ TopicB  [==------] 28%  "gap" ]                  │
└─────────────────────────────────────────────────────┘
```
Use existing `renderGapSummary(s)` markup: `.gapcard` with `.gap-row`, `.scorebar > i` width = coverage*100, `.glabel` for gapLevel. Place directly below filter bar and above grid (or inside #gapDetails). This is the differentiator — do not style it as a marketing feature grid; style it as a diagnostic.

### SECTION 8 — Weekly Plan Strip — "The Scheduled Path" (ADDED)

```
  #weeklyPlan: h3 "Weekly plan" + .week-grid of .week-card (b Week N · start date → action) — existing render. Keep as small cards below the grid when LAST_RESULT.path.weeklyPlan exists. No new motion.
```

### SECTION 9 — Footer — "The Quiet Exit" (REMOVE)

Reference footer (4-col) and bottom bar are **REMOVED**. App retains its `.statusbar` (#statusText + #engineBadge). Do not add a marketing footer inside #panel-resume — it would clash with the app shell.

---

## Embedded State Machines (transplanted)

```
STATE MACHINE: Filter-controlled template grid — "The Quiet Filter"
Location: Filter Bar + Grid (Sections 3 + 5)
Type: Cycler (filter selection, not timed)
STATES:
  State A: filter = "All" → grid shows all 6 cards
  State B: filter = "<tag>" → grid shows subset where tags includes selected tag (e.g. "Two Column" → modern + sigma)
  State C: filter = tag with 0 matches → empty state: text-center py-16 14px gray-400 → "No templates match this filter yet. More coming soon!"
INITIAL STATE: State A ("All")
TRANSITION A→B:
  Trigger: click on filter pill OR card tag pill (onClick sets selected var)
  Element 1: outgoing cards instant DOM removal (no exit animation — reference has none)
  Element 2: incoming cards instant appear (no entrance)
  Element 3: pill bg/color swap 150ms ease (see diff table)
  Data logic: `filtered = selected==="All" ? all : all.filter(t => t.tags.includes(selected))`
TRANSITION B→A / B→B: same — instant swap + 150ms pill
LOOP: user-controlled infinite
INTERNAL LAYOUT:
  Container: max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8
  Empty: text-center py-16 text-sm gray-400
  Each card: flex flex-col rounded-2xl overflow-hidden flex-1 desc pushes CTA to bottom

STATE MACHINE: Lazy preview loader
Location: Grid preview area (Section 5)
Type: Promise loader (reference uses Next.js dynamic ssr:false)
STATES:
  State A: Loading → div h-full bg-gray-100 animate-pulse (pulse 2s ease-in-out infinite: opacity 1 → 0.5 → 1)
  State B: Loaded → zoomed resume at 0.163
INITIAL STATE: State A
TRANSITION A→B:
  Trigger: template component / thumbnail ready (for Pathlight: static div or real resume render ready)
  Action: hard swap placeholder → rendered preview (no crossfade)
LOOP: once per card
```

---

## 4. TECHNICAL REQUIREMENTS

```
TECHNICAL REQUIREMENTS
  Stack:                Vanilla HTML/CSS/JS inside existing SPA (no new framework). Add Tailwind CSS 3.4.17 via CDN (https://cdn.tailwindcss.com) or local build for #panel-resume only; keep existing public/styles.css for app shell. No React needed — replicate reference's layout with CSS Grid/Flex + vanilla JS for filtering. If Tailwind is undesirable, replicate tokens in plain CSS (map all hexes above to CSS vars).
  Animation:            CSS transitions only (Tailwind transition-all / transition-colors duration-150–200). No GSAP, no Framer, no Lenis — per intensity 2 and reference's actual stack (reference uses no JS animation lib).
  Scroll:               native (no scroll library, no parallax, no pinning). Reference has zero scroll choreography — do NOT add ScrollTrigger, sticky stacking, or parallax.
  Animation Lifecycle:  No GSAP context needed. For hover lifts: pure CSS :hover with transition-all 200ms cubic-bezier(0.25, 0.1, 0.25, 1). For filter swaps: vanilla JS re-render + CSS transition-colors 150ms on pills; no entrance/exit animations.
  Scroll Trigger Setup: N/A — no scroll triggers (reference has zero scroll choreography; do not add start: top 80% triggers) — no scroll triggers. If you add any, you are diverging from the reference.
  Hover Implementation: CSS :hover only. Filter pill = transition-colors on background/color/border. Card = transition-all on transform/box-shadow + overlay bg-black/0→10 + pill opacity 0→1. Banner CTA = group-hover (parent .group) for CTA bg white→emerald-50. No ::before slide tricks — reference uses flat color swaps.
  Custom Cursor:        N/A — reference has no custom cursor. Do not add.
  Font Loading:         Keep existing Pathlight fonts (system) OR adopt reference's Geist Sans + Geist Mono via Next.js woff preload pattern if you want pixel parity: preload https://www.lets-code.co.in/_next/static/media/4473ecc91f70f139-s.p.woff (Geist Sans 100-900) and 463dafcda517f24f-s.p.woff (Geist Mono) with @font-face __geistSans_1e4310 / __geistMono_c3aa02 as in Site DNA 1.2. Fallback to system-ui, -apple-system, Segoe UI. Weight 800 for Display must be available.
  Image Sources:        No photography. Previews are DOM-rendered resume thumbnails at zoom 0.163 (reference technique: `style="zoom:0.163; pointerEvents:none; userSelect:none"` inside 110×150 or h-72 container with bottom 48px fade). For Pathlight, either reuse an existing resume thumbnail component or build minimal static preview divs (white card with gray lines + accent header color per template). Do not use Unsplash for this panel — it would be a fidelity break. If you need a placeholder for the zoomed content, use gray-300 lines and the template's accent color header (Classic #111827 etc.).
```

Additional constraints for Pathlight integration:
- All filtering state lives in vanilla JS (`let selected = "All"`), mirrors reference's `useState("All")`. Grid is re-rendered via `innerHTML` on change — keep it simple, do not pull in React.
- Card tag clicks set the same `selected` var and re-trigger the filter — cross-component state as in reference's `onClick: () => t(a)` on card tags.
- Resume textarea + analyze button keep existing API contract: `POST /api/session/:id {resume}` → `GET /api/session/:id` → `LAST_RESULT = {profile, path, gapReport, explanation, recommendation, audit}` → re-render `renderGapSummary` + grid gap badges. Do not change the API.
- Gap badges on cards read from `LAST_RESULT.gapReport.topics.find(t => t.topicId === card.id)` → `Math.round(coverage*100) + "%" + gapLevel`. If gapReport is null (no resume yet), hide badges.
- Preserve existing Pathlight tab behavior (`$$(".tab")` click → `.panel` switch) — the new hero/filter/grid live entirely inside `#panel-resume`, no global nav changes.

---

## 5. EXECUTION DIRECTIVE

*Do not build a gallery; build a mirror that tells the truth — every pixel should make a gap visible and a next step obvious.*

